from flask import Flask, jsonify
from flask_cors import CORS
import oracledb
import json
import os

app = Flask(__name__)
app.json.sort_keys = False
CORS(app)

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
        import traceback
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
    
    weak_to = [t for t, m in defensive.items() if m > 1]
    resistant_to = [t for t, m in defensive.items() if 0 < m < 1]
    immune_to = [t for t, m in defensive.items() if m == 0]
    
    super_effective = [t for t, m in offensive.items() if m > 1]
    not_very_effective = [t for t, m in offensive.items() if 0 < m < 1]
    no_effect = [t for t, m in offensive.items() if m == 0]
    
    return {
        "defensive": {
            "weak_to": weak_to,
            "resistant_to": resistant_to,
            "immune_to": immune_to,
            "multipliers": defensive
        },
        "offensive": {
            "super_effective": super_effective,
            "not_very_effective": not_very_effective,
            "no_effect": no_effect,
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
    else:
        return pokemon_id

def build_evolution_tree(cur, current_id, target_id):
    cur.execute("""
        SELECT id, name, image 
        FROM pokemon 
        WHERE id = :id
    """, {"id": current_id})
    
    pokemon = cur.fetchone()
    if not pokemon:
        return None
    
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
        evo_id = evo[0]
        to_pokemon_id = evo[1]
        
        cur.execute("""
            SELECT requirement_type, requirement_value
            FROM evolution_requirements
            WHERE evolution_id = :evo_id
            ORDER BY id
        """, {"evo_id": evo_id})
        
        requirements = cur.fetchall()
        req_text = format_requirements(requirements)
        
        next_node = build_evolution_tree(cur, to_pokemon_id, target_id)
        
        if next_node:
            next_node['requirement'] = req_text
            node['evolutions'].append(next_node)
    
    return node

def format_requirements(requirements):
    if not requirements:
        return "Unknown"
    
    parts = []
    for req_type, req_value in requirements:
        req_type = req_type.lower() if req_type else ""
        req_value = str(req_value) if req_value else ""
        
        if req_type == "level":
            parts.append(f"Level {req_value}")
        elif req_type == "item":
            parts.append(f"Item: {req_value}")
        elif req_type == "gender":
            parts.append(f"Gender: {req_value}")
        elif req_type == "friendship":
            parts.append(f"Friendship: {req_value}")
        elif req_type == "time":
            parts.append(f"Time: {req_value}")
        elif req_type == "location":
            parts.append(f"Location: {req_value}")
        elif req_type == "trade":
            parts.append("Trade")
        else:
            if req_value:
                parts.append(f"{req_type.title()}: {req_value}")
            else:
                parts.append(req_type.title())
    
    return " + ".join(parts) if parts else "Unknown"

# ========================
# 3. API: GET ABILITY DETAILS
# ========================
@app.route("/api/abilities/<int:ability_id>")
def get_ability_details(ability_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB Connection Failed"}), 500

    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id, name, description
            FROM abilities
            WHERE id = :id
        """, {"id": ability_id})
        
        ability_row = cur.fetchone()
        if not ability_row:
            return jsonify({"error": "Ability not found"}), 404
        
        ability_data = {
            "id": ability_row[0],
            "name": ability_row[1],
            "description": ability_row[2]
        }
        
        cur.execute("""
            SELECT DISTINCT p.id, p.name, p.type1, p.type2
            FROM POKEMON_MASTER_VIEW p
            JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
            WHERE pa.ability_id = :ability_id
            ORDER BY p.name
        """, {"ability_id": ability_id})
        
        pokemon_list = []
        for poke_row in cur.fetchall():
            pokemon_list.append({
                "id": poke_row[0],
                "name": poke_row[1],
                "type1": poke_row[2],
                "type2": poke_row[3]
            })
        
        ability_data['pokemon'] = pokemon_list
        ability_data['pokemon_count'] = len(pokemon_list)
        
        return jsonify(ability_data)
    
    except Exception as e:
        print(f"Error in get_ability_details: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# ========================
# 4. API: GET ALL ABILITIES
# ========================
@app.route("/api/abilities")
def get_all_abilities():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB Connection Failed"}), 500

    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT a.id, a.name, a.description, COUNT(DISTINCT pa.pokemon_id) as pokemon_count
            FROM abilities a
            LEFT JOIN pokemon_abilities pa ON a.id = pa.ability_id
            GROUP BY a.id, a.name, a.description
            ORDER BY a.name
        """)
        
        abilities = []
        for row in cur.fetchall():
            abilities.append({
                "id": row[0],
                "name": row[1],
                "description": row[2],
                "pokemon_count": row[3]
            })
        
        return jsonify(abilities)
    
    except Exception as e:
        print(f"Error in get_all_abilities: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# ========================
# 5. API: GET TYPE DETAILS
# ========================
@app.route("/api/types/<string:type_name>")
def get_type_details(type_name):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB Connection Failed"}), 500

    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT id, name
            FROM types
            WHERE LOWER(name) = LOWER(:name)
        """, {"name": type_name})
        
        type_row = cur.fetchone()
        if not type_row:
            return jsonify({"error": "Type not found"}), 404
        
        type_id = type_row[0]
        type_name_db = type_row[1]
        
        type_data = {
            "id": type_id,
            "name": type_name_db
        }
        
        cur.execute("""
            SELECT DISTINCT id, name, type1, type2
            FROM POKEMON_MASTER_VIEW
            WHERE LOWER(type1) = LOWER(:type_name) OR LOWER(type2) = LOWER(:type_name)
            ORDER BY id
        """, {"type_name": type_name_db})
        
        pokemon_list = []
        for poke_row in cur.fetchall():
            pokemon_list.append({
                "id": poke_row[0],
                "name": poke_row[1],
                "type1": poke_row[2],
                "type2": poke_row[3]
            })
        
        type_data['pokemon'] = pokemon_list
        type_data['pokemon_count'] = len(pokemon_list)
        type_data['effectiveness'] = get_type_matchups(cur, type_id)
        
        return jsonify(type_data)
    
    except Exception as e:
        print(f"Error in get_type_details: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# ========================
# 6. API: GET ALL TYPES
# ========================
@app.route("/api/types")
def get_all_types():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB Connection Failed"}), 500

    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT t.id, t.name, COUNT(DISTINCT p.id) as pokemon_count
            FROM types t
            LEFT JOIN POKEMON_MASTER_VIEW p ON (LOWER(p.type1) = LOWER(t.name) OR LOWER(p.type2) = LOWER(t.name))
            GROUP BY t.id, t.name
            ORDER BY t.name
        """)
        
        types = []
        for row in cur.fetchall():
            types.append({
                "id": row[0],
                "name": row[1],
                "pokemon_count": row[2]
            })
        
        return jsonify(types)
    
    except Exception as e:
        print(f"Error in get_all_types: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# ========================
# HELPER: GET TYPE MATCHUPS
# ========================
def get_type_matchups(cur, type_id):
    cur.execute("SELECT id, name FROM types ORDER BY name")
    all_types = cur.fetchall()
    
    offensive = {}
    for def_type_id, def_type_name in all_types:
        cur.execute("""
            SELECT multiplier 
            FROM type_effectiveness 
            WHERE attack_type_id = :atk AND defense_type_id = :def
        """, {"atk": type_id, "def": def_type_id})
        result = cur.fetchone()
        multiplier = float(result[0]) if result and result[0] is not None else 1.0
        offensive[def_type_name.lower()] = multiplier
    
    defensive = {}
    for atk_type_id, atk_type_name in all_types:
        cur.execute("""
            SELECT multiplier 
            FROM type_effectiveness 
            WHERE attack_type_id = :atk AND defense_type_id = :def
        """, {"atk": atk_type_id, "def": type_id})
        result = cur.fetchone()
        multiplier = float(result[0]) if result and result[0] is not None else 1.0
        defensive[atk_type_name.lower()] = multiplier
    
    super_effective = [t for t, m in offensive.items() if m > 1]
    not_very_effective = [t for t, m in offensive.items() if 0 < m < 1]
    no_effect_offensive = [t for t, m in offensive.items() if m == 0]
    
    weak_to = [t for t, m in defensive.items() if m > 1]
    resistant_to = [t for t, m in defensive.items() if 0 < m < 1]
    immune_to = [t for t, m in defensive.items() if m == 0]
    
    return {
        "offensive": {
            "super_effective": super_effective,
            "not_very_effective": not_very_effective,
            "no_effect": no_effect_offensive
        },
        "defensive": {
            "weak_to": weak_to,
            "resistant_to": resistant_to,
            "immune_to": immune_to
        }
    }

# ========================
# HEALTH CHECK ENDPOINT
# ========================
@app.route("/health")
def health_check():
    conn = get_connection()
    if conn:
        conn.close()
        return jsonify({"status": "healthy", "database": "connected"}), 200
    return jsonify({"status": "unhealthy", "database": "disconnected"}), 500

# ========================
# START SERVER
# ========================
if __name__ == "__main__":
    print(f"🚀 Starting Flask Server on http://0.0.0.0:5000")
    print(f"🔗 Database: {DB_CONFIG['dsn']}")
    app.run(host="0.0.0.0", debug=False, port=5000)