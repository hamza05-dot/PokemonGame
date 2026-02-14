from flask import Flask, jsonify
from flask_cors import CORS
import oracledb
import json
import os
import traceback
from datetime import datetime, timedelta

app = Flask(__name__)
app.json.sort_keys = False
CORS(app)

# ========================
# SIMPLE CACHE SYSTEM
# ========================
types_cache = {"data": None, "timestamp": None}
abilities_cache = {"data": None, "timestamp": None}
CACHE_DURATION = timedelta(minutes=10)

def is_cache_valid(cache):
    """Check if cache is valid"""
    if cache["data"] and cache["timestamp"]:
        return datetime.now() - cache["timestamp"] < CACHE_DURATION
    return False

# ========================
# ENABLE THICK MODE FOR ORACLE 11g
# ========================
try:
    # Initialize thick mode with explicit path (required for Oracle 11g)
    oracledb.init_oracle_client(lib_dir="/opt/oracle/instantclient_23_4")
    print("✓ Oracle Client initialized in THICK mode (Oracle 11g compatible)")
except Exception as e:
    print(f"⚠ Could not initialize thick mode: {e}")
    print("⚠ Continuing with thin mode (may fail with Oracle 11g)")

# ========================
# DATABASE CONFIGURATION (Docker-ready)
# ========================
DB_CONFIG = {
    "user": os.getenv("DB_USER", "pokedb"),
    "password": os.getenv("DB_PASSWORD", "5687"),
    "dsn": f"{os.getenv('DB_HOST', '127.0.0.1')}:{os.getenv('DB_PORT', '1521')}/{os.getenv('DB_SID', 'XE')}"
}

print(f"🔗 Connecting to Oracle: {DB_CONFIG['dsn']} as {DB_CONFIG['user']}")

def get_connection():
    try:
        return oracledb.connect(**DB_CONFIG)
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return None

# ========================
# 1. API: GET ALL POKEMON
# ========================
@app.route("/api/pokemon")
def get_all_pokemon():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB Connection Failed"}), 500

    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM POKEMON_MASTER_VIEW ORDER BY id")
        columns = [col[0].lower() for col in cur.description]
        results = []

        for row in cur:
            data = dict(zip(columns, row))

            # Handle JSON field
            if data.get('evo_data_json'):
                try:
                    content = data['evo_data_json'].read() if hasattr(data['evo_data_json'], 'read') else data['evo_data_json']
                    if isinstance(content, str):
                        data['evo_data_json'] = json.loads(content)
                    else:
                        data['evo_data_json'] = content
                except:
                    data['evo_data_json'] = []
            else:
                data['evo_data_json'] = []

            results.append(data)

        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# ========================
# 2. API: GET POKEMON DETAILS
# ========================
@app.route("/api/pokemon/<int:poke_id>")
def get_pokemon_details(poke_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB Connection Failed"}), 500

    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT 
                id, name, description, hp, attack, defense,
                sp_atk, sp_def, speed, bst, generation,
                legendary, final_evolution, height, weight, 
                bmi, catch_rate, image, type1, type2, abilities
            FROM POKEMON_MASTER_VIEW
            WHERE id = :id
        """, {"id": poke_id})
        
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Pokemon not found"}), 404

        columns = [col[0].lower() for col in cur.description]
        pokemon_data = dict(zip(columns, row))

        region_map = {
            1: "Kanto", 2: "Johto", 3: "Hoenn", 4: "Sinnoh",
            5: "Unova", 6: "Kalos", 7: "Alola", 8: "Galar", 9: "Paldea"
        }
        pokemon_data['region'] = region_map.get(pokemon_data.get('generation'), "Unknown")

        cur.execute("""
            SELECT a.id, a.name, a.description
            FROM abilities a
            JOIN pokemon_abilities pa ON a.id = pa.ability_id
            WHERE pa.pokemon_id = :id
            ORDER BY a.name
        """, {"id": poke_id})
        
        abilities_data = []
        for ability_row in cur.fetchall():
            abilities_data.append({
                "id": ability_row[0],
                "name": ability_row[1],
                "description": ability_row[2]
            })
        
        pokemon_data['abilities_data'] = abilities_data

        type1 = pokemon_data.get('type1')
        type2 = pokemon_data.get('type2')
        pokemon_data['type_effectiveness'] = calculate_type_effectiveness(cur, type1, type2)

        evolution_chain = get_complete_evolution_chain(cur, poke_id)
        pokemon_data['evolution_chain'] = evolution_chain

        return jsonify(pokemon_data)
    
    except Exception as e:
        print(f"Error in get_pokemon_details: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# ========================
# HELPER: CALCULATE TYPE EFFECTIVENESS
# ========================
def calculate_type_effectiveness(cur, type1, type2=None):
    cur.execute("SELECT id FROM types WHERE LOWER(name) = LOWER(:type1)", {"type1": type1})
    type1_row = cur.fetchone()
    if not type1_row:
        return {}
    type1_id = type1_row[0]
    
    type2_id = None
    if type2:
        cur.execute("SELECT id FROM types WHERE LOWER(name) = LOWER(:type2)", {"type2": type2})
        type2_row = cur.fetchone()
        if type2_row:
            type2_id = type2_row[0]
    
    defensive = {}
    cur.execute("SELECT id, name FROM types ORDER BY name")
    all_types = cur.fetchall()
    
    for attack_type_id, attack_type_name in all_types:
        multiplier = 1.0
        
        cur.execute("""
            SELECT multiplier 
            FROM type_effectiveness 
            WHERE attack_type_id = :atk AND defense_type_id = :def
        """, {"atk": attack_type_id, "def": type1_id})
        result = cur.fetchone()
        if result:
            multiplier *= float(result[0]) if result[0] is not None else 1.0
        
        if type2_id:
            cur.execute("""
                SELECT multiplier 
                FROM type_effectiveness 
                WHERE attack_type_id = :atk AND defense_type_id = :def
            """, {"atk": attack_type_id, "def": type2_id})
            result = cur.fetchone()
            if result:
                multiplier *= float(result[0]) if result[0] is not None else 1.0
        
        defensive[attack_type_name.lower()] = multiplier
    
    offensive = {}
    for defense_type_id, defense_type_name in all_types:
        cur.execute("""
            SELECT multiplier 
            FROM type_effectiveness 
            WHERE attack_type_id = :atk AND defense_type_id = :def
        """, {"atk": type1_id, "def": defense_type_id})
        result = cur.fetchone()
        multiplier = float(result[0]) if result and result[0] is not None else 1.0
        offensive[defense_type_name.lower()] = multiplier
    
    return {
        "defensive": {
            "weak_to": [t for t, m in defensive.items() if m > 1],
            "resistant_to": [t for t, m in defensive.items() if 0 < m < 1],
            "immune_to": [t for t, m in defensive.items() if m == 0],
            "multipliers": defensive
        },
        "offensive": {
            "super_effective": [t for t, m in offensive.items() if m > 1],
            "not_very_effective": [t for t, m in offensive.items() if 0 < m < 1],
            "no_effect": [t for t, m in offensive.items() if m == 0],
            "multipliers": offensive
        }
    }

# ========================
# HELPER: BUILD COMPLETE EVOLUTION CHAIN
# ========================
def get_complete_evolution_chain(cur, pokemon_id):
    root_id = find_evolution_root(cur, pokemon_id)
    chain = build_evolution_tree(cur, root_id, pokemon_id)
    return chain

def find_evolution_root(cur, pokemon_id):
    cur.execute("""
        SELECT from_pokemon_id 
        FROM pokemon_evolutions 
        WHERE to_pokemon_id = :id
    """, {"id": pokemon_id})
    result = cur.fetchone()
    if result:
        return find_evolution_root(cur, result[0])
    return pokemon_id

def build_evolution_tree(cur, current_id, target_id):
    cur.execute("SELECT id, name, image FROM pokemon WHERE id = :id", {"id": current_id})
    pokemon = cur.fetchone()
    if not pokemon: return None
    
    node = {
        "id": pokemon[0],
        "name": pokemon[1],
        "image": pokemon[2],
        "is_current": (pokemon[0] == target_id),
        "evolutions": []
    }
    
    cur.execute("""
        SELECT pe.id, pe.to_pokemon_id, p.name, p.image
        FROM pokemon_evolutions pe
        JOIN pokemon p ON pe.to_pokemon_id = p.id
        WHERE pe.from_pokemon_id = :id
        ORDER BY pe.to_pokemon_id
    """, {"id": current_id})
    
    evolutions = cur.fetchall()
    for evo in evolutions:
        evo_id, to_id, name, img = evo
        cur.execute("""
            SELECT requirement_type, requirement_value
            FROM evolution_requirements
            WHERE evolution_id = :evo_id
            ORDER BY id
        """, {"evo_id": evo_id})
        
        req_text = format_requirements(cur.fetchall())
        next_node = build_evolution_tree(cur, to_id, target_id)
        if next_node:
            next_node['requirement'] = req_text
            node['evolutions'].append(next_node)
    
    return node

def format_requirements(requirements):
    if not requirements: return "Unknown"
    parts = []
    for req_type, req_value in requirements:
        req_type = req_type.lower() if req_type else ""
        req_value = str(req_value) if req_value else ""
        if req_type == "level": parts.append(f"Level {req_value}")
        elif req_type == "item": parts.append(f"Item: {req_value}")
        elif req_type == "trade": parts.append("Trade")
        else: parts.append(f"{req_type.title()}: {req_value}" if req_value else req_type.title())
    return " + ".join(parts) if parts else "Unknown"

# ========================
# 3. API: ABILITIES & TYPES
# ========================
@app.route("/api/abilities")
def get_all_abilities():
    # Check cache first
    if is_cache_valid(abilities_cache):
        print("✓ Returning cached abilities")
        return jsonify(abilities_cache["data"])
    
    conn = get_connection()
    if not conn: return jsonify({"error": "DB Connection Failed"}), 500
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT a.id, a.name, a.description, COUNT(DISTINCT pa.pokemon_id)
            FROM abilities a
            LEFT JOIN pokemon_abilities pa ON a.id = pa.ability_id
            GROUP BY a.id, a.name, a.description ORDER BY a.name
        """)
        abilities = [{"id": r[0], "name": r[1], "description": r[2], "pokemon_count": r[3]} for r in cur.fetchall()]
        
        # Update cache
        abilities_cache["data"] = abilities
        abilities_cache["timestamp"] = datetime.now()
        print(f"✓ Cached {len(abilities)} abilities")
        
        return jsonify(abilities)
    finally:
        cur.close()
        conn.close()

@app.route("/api/abilities/<int:ability_id>")
def get_ability_details(ability_id):
    conn = get_connection()
    if not conn: return jsonify({"error": "DB Connection Failed"}), 500
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, name, description FROM abilities WHERE id = :id", {"id": ability_id})
        ability_row = cur.fetchone()
        if not ability_row: return jsonify({"error": "Ability not found"}), 404
        
        cur.execute("""
            SELECT DISTINCT p.id, p.name, p.type1, p.type2 FROM POKEMON_MASTER_VIEW p
            JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
            WHERE pa.ability_id = :id ORDER BY p.name
        """, {"id": ability_id})
        pokemon = [{"id": r[0], "name": r[1], "type1": r[2], "type2": r[3]} for r in cur.fetchall()]
        
        return jsonify({"id": ability_row[0], "name": ability_row[1], "description": ability_row[2], "pokemon": pokemon, "pokemon_count": len(pokemon)})
    finally:
        cur.close()
        conn.close()

# ========================
# API: GET ALL TYPES (OPTIMIZED WITH CACHE)
# ========================
@app.route("/api/types")
def get_all_types():
    # Check cache first
    if is_cache_valid(types_cache):
        print("✓ Returning cached types")
        return jsonify(types_cache["data"])
    
    conn = get_connection()
    if not conn: return jsonify({"error": "DB Connection Failed"}), 500
    cur = conn.cursor()
    try:
        # OPTIMIZED QUERY: Use view (where type1/type2 exist) with subquery
        cur.execute("""
            SELECT t.id, t.name,
                   (SELECT COUNT(DISTINCT p.id)
                    FROM POKEMON_MASTER_VIEW p
                    WHERE LOWER(p.type1) = LOWER(t.name) 
                       OR LOWER(p.type2) = LOWER(t.name)) as pokemon_count
            FROM types t
            ORDER BY t.name
        """)
        types = [{"id": r[0], "name": r[1], "pokemon_count": r[2]} for r in cur.fetchall()]
        
        # Update cache
        types_cache["data"] = types
        types_cache["timestamp"] = datetime.now()
        print(f"✓ Cached {len(types)} types")
        
        return jsonify(types)
    finally:
        cur.close()
        conn.close()

@app.route("/api/types/<string:type_name>")
def get_type_details(type_name):
    conn = get_connection()
    if not conn: return jsonify({"error": "DB Connection Failed"}), 500
    cur = conn.cursor()
    try:
        # Case-insensitive lookup
        cur.execute("SELECT id, name FROM types WHERE LOWER(name) = LOWER(:n)", {"n": type_name})
        t_row = cur.fetchone()
        if not t_row: return jsonify({"error": f"Type '{type_name}' not found"}), 404

        # Use POKEMON_MASTER_VIEW (where type1/type2 exist)
        cur.execute("""
            SELECT DISTINCT id, name, type1, type2 
            FROM POKEMON_MASTER_VIEW
            WHERE LOWER(type1) = LOWER(:n) OR LOWER(type2) = LOWER(:n)
            ORDER BY id
        """, {"n": t_row[1]})
        pokemon = [{"id": r[0], "name": r[1], "type1": r[2], "type2": r[3]} for r in cur.fetchall()]

        return jsonify({
            "id": t_row[0],
            "name": t_row[1],
            "pokemon": pokemon,
            "pokemon_count": len(pokemon),
            "effectiveness": get_type_matchups(cur, t_row[0])
        })
    finally:
        cur.close()
        conn.close()

def get_type_matchups(cur, type_id):
    cur.execute("SELECT id, name FROM types ORDER BY name")
    all_types = cur.fetchall()
    off, df = {}, {}
    for tid, tname in all_types:
        cur.execute("SELECT multiplier FROM type_effectiveness WHERE attack_type_id = :a AND defense_type_id = :d", {"a": type_id, "d": tid})
        r = cur.fetchone()
        off[tname.lower()] = float(r[0]) if r else 1.0
        cur.execute("SELECT multiplier FROM type_effectiveness WHERE attack_type_id = :a AND defense_type_id = :d", {"a": tid, "d": type_id})
        r = cur.fetchone()
        df[tname.lower()] = float(r[0]) if r else 1.0
        
    return {
        "offensive": {"super_effective": [t for t, m in off.items() if m > 1], "not_very_effective": [t for t, m in off.items() if 0 < m < 1], "no_effect": [t for t, m in off.items() if m == 0]},
        "defensive": {"weak_to": [t for t, m in df.items() if m > 1], "resistant_to": [t for t, m in df.items() if 0 < m < 1], "immune_to": [t for t, m in df.items() if m == 0]}
    }

# ========================
# 4. API: ITEMS
# ========================
@app.route("/api/items")
def get_all_items():
    conn = get_connection()
    if not conn: return jsonify({"error": "DB Connection Failed"}), 500
    cur = conn.cursor()
    try:
        cur.execute("SELECT ITEM_ID, ITEM_NAME, CATEGORY, EFFECT FROM POKEMON_ITEMS ORDER BY ITEM_NAME ASC")
        columns = [col[0].lower() for col in cur.description]
        items = [dict(zip(columns, row)) for row in cur.fetchall()]
        return jsonify(items)
    finally:
        cur.close()
        conn.close()

@app.route("/api/items/<int:item_id>")
def get_item_details(item_id):
    conn = get_connection()
    if not conn: return jsonify({"error": "DB Connection Failed"}), 500
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM POKEMON_ITEMS WHERE ITEM_ID = :id", {"id": item_id})
        row = cur.fetchone()
        if not row: return jsonify({"error": "Item not found"}), 404
        columns = [col[0].lower() for col in cur.description]
        return jsonify(dict(zip(columns, row)))
    finally:
        cur.close()
        conn.close()

# ========================
# CACHE MANAGEMENT
# ========================
@app.route("/api/cache/clear")
def clear_cache():
    """Clear all caches - useful for development"""
    types_cache["data"] = None
    types_cache["timestamp"] = None
    abilities_cache["data"] = None
    abilities_cache["timestamp"] = None
    return jsonify({"status": "Cache cleared"}), 200

@app.route("/api/cache/status")
def cache_status():
    """Check cache status"""
    return jsonify({
        "types": {
            "cached": types_cache["data"] is not None,
            "valid": is_cache_valid(types_cache),
            "timestamp": types_cache["timestamp"].isoformat() if types_cache["timestamp"] else None
        },
        "abilities": {
            "cached": abilities_cache["data"] is not None,
            "valid": is_cache_valid(abilities_cache),
            "timestamp": abilities_cache["timestamp"].isoformat() if abilities_cache["timestamp"] else None
        }
    }), 200

# ========================
# HEALTH CHECK & START
# ========================
@app.route("/health")
def health_check():
    conn = get_connection()
    if conn:
        conn.close()
        return jsonify({"status": "healthy", "database": "connected"}), 200
    return jsonify({"status": "unhealthy", "database": "disconnected"}), 500

if __name__ == "__main__":
    print(f"🚀 Starting Flask Server on http://0.0.0.0:5000")
    print(f"📦 Cache enabled: Types & Abilities (10 min TTL)")
    app.run(host="0.0.0.0", debug=False, port=5000)
