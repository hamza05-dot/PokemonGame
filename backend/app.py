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
types_cache      = {"data": None, "timestamp": None}
abilities_cache  = {"data": None, "timestamp": None}
CACHE_DURATION   = timedelta(minutes=10)

def is_cache_valid(cache):
    if cache["data"] and cache["timestamp"]:
        return datetime.now() - cache["timestamp"] < CACHE_DURATION
    return False

# ========================
# ENABLE THICK MODE FOR ORACLE 11g
# ========================
try:
    oracledb.init_oracle_client(lib_dir="/opt/oracle/instantclient_23_4")
    print("✓ Oracle Client initialized in THICK mode (Oracle 11g compatible)")
except Exception as e:
    print(f"⚠ Could not initialize thick mode: {e}")
    print("⚠ Continuing with thin mode (may fail with Oracle 11g)")

# ========================
# DATABASE CONFIGURATION
# ========================
DB_CONFIG = {
    "user":     os.getenv("DB_USER",     "pokedb"),
    "password": os.getenv("DB_PASSWORD", "5687"),
    "dsn":      f"{os.getenv('DB_HOST', '127.0.0.1')}:{os.getenv('DB_PORT', '1521')}/{os.getenv('DB_SID', 'XE')}"
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
        # POKEMON_MASTER_VIEW already contains TYPE1, TYPE2, ABILITIES, EVO_DATA_JSON
        cur.execute("SELECT * FROM POKEMON_MASTER_VIEW ORDER BY id")
        columns = [col[0].lower() for col in cur.description]
        results = []

        for row in cur:
            data = dict(zip(columns, row))

            # Handle CLOB / JSON field
            if data.get("evo_data_json"):
                try:
                    content = data["evo_data_json"].read() if hasattr(data["evo_data_json"], "read") else data["evo_data_json"]
                    data["evo_data_json"] = json.loads(content) if isinstance(content, str) else content
                except Exception:
                    data["evo_data_json"] = []
            else:
                data["evo_data_json"] = []

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
        # ── Core data from POKEMON_MASTER_VIEW ──────────────────────────────
        cur.execute("""
            SELECT id, name, description, hp, attack, defense,
                   sp_atk, sp_def, speed, bst, generation,
                   legendary, final_evolution, height, weight,
                   bmi, catch_rate, image, type1, type2, abilities
            FROM POKEMON_MASTER_VIEW
            WHERE id = :id
        """, {"id": poke_id})

        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Pokemon not found"}), 404

        columns        = [col[0].lower() for col in cur.description]
        pokemon_data   = dict(zip(columns, row))

        region_map = {
            1: "Kanto", 2: "Johto",  3: "Hoenn",  4: "Sinnoh",
            5: "Unova", 6: "Kalos",  7: "Alola",  8: "Galar",  9: "Paldea"
        }
        pokemon_data["region"] = region_map.get(pokemon_data.get("generation"), "Unknown")

        # ── Abilities from ABILITIES table via POKEMON_ABILITIES ─────────────
        cur.execute("""
            SELECT a.id, a.name, a.description
            FROM abilities a
            JOIN pokemon_abilities pa ON a.id = pa.ability_id
            WHERE pa.pokemon_id = :id
            ORDER BY a.name
        """, {"id": poke_id})
        pokemon_data["abilities_data"] = [
            {"id": r[0], "name": r[1], "description": r[2]}
            for r in cur.fetchall()
        ]

        # ── Types from POKEMON_TYPES junction table (now used!) ──────────────
        cur.execute("""
            SELECT t.id, t.name
            FROM types t
            JOIN pokemon_types pt ON t.id = pt.type_id
            WHERE pt.pokemon_id = :id
            ORDER BY pt.type_id
        """, {"id": poke_id})
        type_rows = cur.fetchall()
        pokemon_data["types_data"] = [{"id": r[0], "name": r[1]} for r in type_rows]

        # Build type1 / type2 from junction table (authoritative source)
        type_names = [r[1] for r in type_rows]
        type1 = type_names[0] if len(type_names) > 0 else pokemon_data.get("type1")
        type2 = type_names[1] if len(type_names) > 1 else pokemon_data.get("type2")

        # ── Type effectiveness ────────────────────────────────────────────────
        pokemon_data["type_effectiveness"] = calculate_type_effectiveness(cur, type1, type2)

        # ── Evolution chain (recursive tree matching frontend structure) ──────
        pokemon_data["evolution_chain"] = get_complete_evolution_chain(cur, poke_id)

        return jsonify(pokemon_data)

    except Exception as e:
        print(f"Error in get_pokemon_details: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        cur.close()
        conn.close()

# ========================
# HELPER: TYPE EFFECTIVENESS
# (uses TYPES + TYPE_EFFECTIVENESS tables)
# ========================
def calculate_type_effectiveness(cur, type1, type2=None):
    cur.execute("SELECT id FROM types WHERE LOWER(name) = LOWER(:t)", {"t": type1})
    row = cur.fetchone()
    if not row:
        return {}
    type1_id = row[0]

    type2_id = None
    if type2:
        cur.execute("SELECT id FROM types WHERE LOWER(name) = LOWER(:t)", {"t": type2})
        row = cur.fetchone()
        if row:
            type2_id = row[0]

    cur.execute("SELECT id, name FROM types ORDER BY name")
    all_types = cur.fetchall()

    defensive = {}
    for atk_id, atk_name in all_types:
        mult = 1.0
        cur.execute("""
            SELECT multiplier FROM type_effectiveness
            WHERE attack_type_id = :a AND defense_type_id = :d
        """, {"a": atk_id, "d": type1_id})
        r = cur.fetchone()
        if r:
            mult *= float(r[0]) if r[0] is not None else 1.0

        if type2_id:
            cur.execute("""
                SELECT multiplier FROM type_effectiveness
                WHERE attack_type_id = :a AND defense_type_id = :d
            """, {"a": atk_id, "d": type2_id})
            r = cur.fetchone()
            if r:
                mult *= float(r[0]) if r[0] is not None else 1.0

        defensive[atk_name.lower()] = mult

    offensive = {}
    for def_id, def_name in all_types:
        cur.execute("""
            SELECT multiplier FROM type_effectiveness
            WHERE attack_type_id = :a AND defense_type_id = :d
        """, {"a": type1_id, "d": def_id})
        r = cur.fetchone()
        offensive[def_name.lower()] = float(r[0]) if r and r[0] is not None else 1.0

    return {
        "defensive": {
            "weak_to":      [t for t, m in defensive.items() if m > 1],
            "resistant_to": [t for t, m in defensive.items() if 0 < m < 1],
            "immune_to":    [t for t, m in defensive.items() if m == 0],
            "multipliers":  defensive
        },
        "offensive": {
            "super_effective":    [t for t, m in offensive.items() if m > 1],
            "not_very_effective": [t for t, m in offensive.items() if 0 < m < 1],
            "no_effect":          [t for t, m in offensive.items() if m == 0],
            "multipliers":        offensive
        }
    }

# ========================
# HELPER: EVOLUTION CHAIN
# Uses POKEMON_EVOLUTIONS + EVOLUTION_REQUIREMENTS tables
# Returns a tree with { id, name, image, is_current, evolutions[], requirement }
# which is exactly what the frontend renderEvolutionSection() expects
# ========================
def get_complete_evolution_chain(cur, pokemon_id):
    root_id = find_evolution_root(cur, pokemon_id)
    return build_evolution_tree(cur, root_id, pokemon_id)

def find_evolution_root(cur, pokemon_id):
    """Walk backwards through evolutions to find the base form"""
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
    """Recursively build the evolution tree node by node"""
    cur.execute("SELECT id, name, image FROM pokemon WHERE id = :id", {"id": current_id})
    pokemon = cur.fetchone()
    if not pokemon:
        return None

    node = {
        "id":         pokemon[0],
        "name":       pokemon[1],
        "image":      pokemon[2],
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

    for evo_id, to_id, name, img in cur.fetchall():
        cur.execute("""
            SELECT requirement_type, requirement_value
            FROM evolution_requirements
            WHERE evolution_id = :evo_id
            ORDER BY id
        """, {"evo_id": evo_id})
        req_text  = format_requirements(cur.fetchall())
        next_node = build_evolution_tree(cur, to_id, target_id)
        if next_node:
            next_node["requirement"] = req_text
            node["evolutions"].append(next_node)

    return node

def format_requirements(requirements):
    if not requirements:
        return "Unknown"
    parts = []
    for req_type, req_value in requirements:
        req_type  = req_type.lower()  if req_type  else ""
        req_value = str(req_value)    if req_value else ""
        if req_type == "level":
            parts.append(f"Level {req_value}")
        elif req_type == "item":
            parts.append(f"Item: {req_value}")
        elif req_type == "trade":
            parts.append("Trade")
        else:
            parts.append(f"{req_type.title()}: {req_value}" if req_value else req_type.title())
    return " + ".join(parts) if parts else "Unknown"

# ========================
# 3. API: ALL ABILITIES
# ========================
@app.route("/api/abilities")
def get_all_abilities():
    if is_cache_valid(abilities_cache):
        print("✓ Returning cached abilities")
        return jsonify(abilities_cache["data"])

    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB Connection Failed"}), 500
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT a.id, a.name, a.description, COUNT(DISTINCT pa.pokemon_id)
            FROM abilities a
            LEFT JOIN pokemon_abilities pa ON a.id = pa.ability_id
            GROUP BY a.id, a.name, a.description
            ORDER BY a.name
        """)
        abilities = [
            {"id": r[0], "name": r[1], "description": r[2], "pokemon_count": r[3]}
            for r in cur.fetchall()
        ]
        abilities_cache["data"]      = abilities
        abilities_cache["timestamp"] = datetime.now()
        print(f"✓ Cached {len(abilities)} abilities")
        return jsonify(abilities)
    finally:
        cur.close()
        conn.close()

@app.route("/api/abilities/<int:ability_id>")
def get_ability_details(ability_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB Connection Failed"}), 500
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, name, description FROM abilities WHERE id = :id", {"id": ability_id})
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Ability not found"}), 404

        # Use POKEMON_TYPES junction to get accurate type data per Pokemon
        cur.execute("""
            SELECT DISTINCT p.id, p.name,
                   (SELECT t.name FROM types t
                    JOIN pokemon_types pt ON t.id = pt.type_id
                    WHERE pt.pokemon_id = p.id AND ROWNUM = 1) AS type1,
                   (SELECT t.name FROM types t
                    JOIN pokemon_types pt ON t.id = pt.type_id
                    WHERE pt.pokemon_id = p.id AND pt.type_id <>
                        (SELECT MIN(pt2.type_id) FROM pokemon_types pt2 WHERE pt2.pokemon_id = p.id)
                    AND ROWNUM = 1) AS type2
            FROM pokemon p
            JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
            WHERE pa.ability_id = :id
            ORDER BY p.name
        """, {"id": ability_id})
        pokemon = [
            {"id": r[0], "name": r[1], "type1": r[2], "type2": r[3]}
            for r in cur.fetchall()
        ]
        return jsonify({
            "id":            row[0],
            "name":          row[1],
            "description":   row[2],
            "pokemon":       pokemon,
            "pokemon_count": len(pokemon)
        })
    finally:
        cur.close()
        conn.close()

# ========================
# 4. API: ALL TYPES
# ========================
@app.route("/api/types")
def get_all_types():
    if is_cache_valid(types_cache):
        print("✓ Returning cached types")
        return jsonify(types_cache["data"])

    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB Connection Failed"}), 500
    cur = conn.cursor()
    try:
        # Count via POKEMON_TYPES junction table (authoritative)
        cur.execute("""
            SELECT t.id, t.name,
                   COUNT(DISTINCT pt.pokemon_id) AS pokemon_count
            FROM types t
            LEFT JOIN pokemon_types pt ON t.id = pt.type_id
            GROUP BY t.id, t.name
            ORDER BY t.name
        """)
        types = [{"id": r[0], "name": r[1], "pokemon_count": r[2]} for r in cur.fetchall()]

        types_cache["data"]      = types
        types_cache["timestamp"] = datetime.now()
        print(f"✓ Cached {len(types)} types")
        return jsonify(types)
    finally:
        cur.close()
        conn.close()

@app.route("/api/types/<string:type_name>")
def get_type_details(type_name):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB Connection Failed"}), 500
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, name FROM types WHERE LOWER(name) = LOWER(:n)", {"n": type_name})
        t_row = cur.fetchone()
        if not t_row:
            return jsonify({"error": f"Type '{type_name}' not found"}), 404

        # Use POKEMON_TYPES junction table to get Pokemon of this type
        cur.execute("""
            SELECT DISTINCT p.id, p.name,
                   mv.type1, mv.type2
            FROM pokemon p
            JOIN pokemon_types pt ON p.id = pt.pokemon_id
            JOIN POKEMON_MASTER_VIEW mv ON p.id = mv.id
            WHERE pt.type_id = :tid
            ORDER BY p.id
        """, {"tid": t_row[0]})
        pokemon = [
            {"id": r[0], "name": r[1], "type1": r[2], "type2": r[3]}
            for r in cur.fetchall()
        ]

        return jsonify({
            "id":            t_row[0],
            "name":          t_row[1],
            "pokemon":       pokemon,
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
        cur.execute("""
            SELECT multiplier FROM type_effectiveness
            WHERE attack_type_id = :a AND defense_type_id = :d
        """, {"a": type_id, "d": tid})
        r = cur.fetchone()
        off[tname.lower()] = float(r[0]) if r else 1.0

        cur.execute("""
            SELECT multiplier FROM type_effectiveness
            WHERE attack_type_id = :a AND defense_type_id = :d
        """, {"a": tid, "d": type_id})
        r = cur.fetchone()
        df[tname.lower()] = float(r[0]) if r else 1.0

    return {
        "offensive": {
            "super_effective":    [t for t, m in off.items() if m > 1],
            "not_very_effective": [t for t, m in off.items() if 0 < m < 1],
            "no_effect":          [t for t, m in off.items() if m == 0]
        },
        "defensive": {
            "weak_to":      [t for t, m in df.items() if m > 1],
            "resistant_to": [t for t, m in df.items() if 0 < m < 1],
            "immune_to":    [t for t, m in df.items() if m == 0]
        }
    }

# ========================
# 5. API: ITEMS
# ========================
@app.route("/api/items")
def get_all_items():
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB Connection Failed"}), 500
    cur = conn.cursor()
    try:
        cur.execute("SELECT item_id, item_name, category, effect FROM pokemon_items ORDER BY item_name ASC")
        columns = [col[0].lower() for col in cur.description]
        return jsonify([dict(zip(columns, row)) for row in cur.fetchall()])
    finally:
        cur.close()
        conn.close()

@app.route("/api/items/<int:item_id>")
def get_item_details(item_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB Connection Failed"}), 500
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM pokemon_items WHERE item_id = :id", {"id": item_id})
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Item not found"}), 404
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
    types_cache["data"] = types_cache["timestamp"] = None
    abilities_cache["data"] = abilities_cache["timestamp"] = None
    return jsonify({"status": "Cache cleared"}), 200

@app.route("/api/cache/status")
def cache_status():
    return jsonify({
        "types": {
            "cached":    types_cache["data"] is not None,
            "valid":     is_cache_valid(types_cache),
            "timestamp": types_cache["timestamp"].isoformat() if types_cache["timestamp"] else None
        },
        "abilities": {
            "cached":    abilities_cache["data"] is not None,
            "valid":     is_cache_valid(abilities_cache),
            "timestamp": abilities_cache["timestamp"].isoformat() if abilities_cache["timestamp"] else None
        }
    }), 200

# ========================
# HEALTH CHECK
# ========================
@app.route("/health")
def health_check():
    conn = get_connection()
    if conn:
        conn.close()
        return jsonify({"status": "healthy", "database": "connected"}), 200
    return jsonify({"status": "unhealthy", "database": "disconnected"}), 500

if __name__ == "__main__":
    print("🚀 Starting Flask Server on http://0.0.0.0:5000")
    print("📦 Cache enabled: Types & Abilities (10 min TTL)")
    app.run(host="0.0.0.0", debug=False, port=5000)