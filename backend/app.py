from flask import Flask, jsonify
from flask_cors import CORS
import oracledb
import json

app = Flask(__name__)
app.json.sort_keys = False
CORS(app)

# ========================
# INITIALIZE THICK MODE FOR ORACLE 11g
# ========================
try:
    # Si vous avez déjà Oracle 11g XE installé, le client est probablement ici :
    oracledb.init_oracle_client(lib_dir=r"C:\oraclexe\app\oracle\product\11.2.0\server\bin")
    print("✓ Oracle Client initialized in THICK mode")
except Exception as e:
    print(f"⚠ Trying without explicit lib_dir...")
    try:
        oracledb.init_oracle_client()
        print("✓ Oracle Client initialized (found automatically)")
    except Exception as e2:
        print(f"✗ Error: {e2}")

# ========================
# DATABASE CONFIGURATION
# ========================
DB_CONFIG = {
    "user": "pokedb",
    "password": "5687",
    "dsn": "127.0.0.1:1521/xe"
}

# ... reste du code identique ...

def get_connection():
    try:
        return oracledb.connect(**DB_CONFIG)
    except Exception as e:
        print(f"Connection Error: {e}")
        return None

# ========================
# 1. API: GET ALL POKEMON (Keep existing for list page)
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

            # Handle JSON field for the list view
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
# 2. API: GET POKEMON DETAILS (COMPLETE)
# ========================
@app.route("/api/pokemon/<int:poke_id>")
def get_pokemon_details(poke_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "DB Connection Failed"}), 500

    cur = conn.cursor()
    try:
        # --- GET BASIC POKEMON INFO FROM VIEW (it already has everything!) ---
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

        # --- GET REGION BASED ON GENERATION ---
        region_map = {
            1: "Kanto", 2: "Johto", 3: "Hoenn", 4: "Sinnoh",
            5: "Unova", 6: "Kalos", 7: "Alola", 8: "Galar", 9: "Paldea"
        }
        pokemon_data['region'] = region_map.get(pokemon_data.get('generation'), "Unknown")

        # --- GET ABILITIES WITH FULL DATA (ID, NAME, DESCRIPTION) ---
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

        # --- GET COMPLETE EVOLUTION CHAIN ---
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
# HELPER: BUILD COMPLETE EVOLUTION CHAIN
# ========================
def get_complete_evolution_chain(cur, pokemon_id):
    """
    Build the COMPLETE evolution chain from first form to all final forms.
    Returns a tree structure with evolution requirements.
    """
    
    # Step 1: Find the ROOT (first pokemon in the chain)
    root_id = find_evolution_root(cur, pokemon_id)
    
    # Step 2: Build the complete tree starting from root
    chain = build_evolution_tree(cur, root_id, pokemon_id)
    
    return chain

def find_evolution_root(cur, pokemon_id):
    """
    Recursively find the first pokemon in the evolution chain.
    """
    cur.execute("""
        SELECT from_pokemon_id 
        FROM pokemon_evolutions 
        WHERE to_pokemon_id = :id
    """, {"id": pokemon_id})
    
    result = cur.fetchone()
    
    if result:
        # This pokemon evolves FROM another, so go deeper
        return find_evolution_root(cur, result[0])
    else:
        # No pre-evolution found, this IS the root
        return pokemon_id

def build_evolution_tree(cur, current_id, target_id):
    """
    Recursively build evolution tree with all branches and requirements.
    """
    
    # Get current pokemon info
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
    
    # Get all direct evolutions FROM this pokemon
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
        to_pokemon_name = evo[2]
        to_pokemon_image = evo[3]
        
        # Get evolution requirements
        cur.execute("""
            SELECT requirement_type, requirement_value
            FROM evolution_requirements
            WHERE evolution_id = :evo_id
            ORDER BY id
        """, {"evo_id": evo_id})
        
        requirements = cur.fetchall()
        req_text = format_requirements(requirements)
        
        # Recursively build the next level
        next_node = build_evolution_tree(cur, to_pokemon_id, target_id)
        
        if next_node:
            next_node['requirement'] = req_text
            node['evolutions'].append(next_node)
    
    return node

def format_requirements(requirements):
    """
    Format evolution requirements into readable text.
    Examples: "Level 16", "Item: Water Stone", "Level 30 + Gender: Male"
    """
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
        # Get ability information
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
        
        # Get all Pokemon with this ability
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
# 4. API: GET ALL ABILITIES (for list/search)
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
# START SERVER
# ========================
if __name__ == "__main__":
    print("Starting Flask Server on http://127.0.0.1:5000")
    app.run(host="0.0.0.0", debug=True, port=5000)
