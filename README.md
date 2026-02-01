# 🔍 PokéSearch - Pokémon Database System

A full-stack web application for searching and exploring Pokémon data with Oracle 11g database backend and modern JavaScript frontend.

![Logo](/frontend/favicon.png)

## 📋 Overview

PokéSearch is a comprehensive Pokémon information system that allows users to search, filter, and view detailed information about Pokémon including their stats, abilities, types, and evolution chains.

## 🛠 Technology Stack

### Backend
- **Python 3.x** with Flask 3.1.2
- **Oracle Database 11g XE**
- **python-oracledb 3.4.2** (Thick mode)
- **Flask-CORS 6.0.2**

### Frontend
- **HTML5**, **CSS3**, **Vanilla JavaScript**
- **Fetch API** for asynchronous data loading

### Database
- **Oracle 11g Express Edition**
- Complete schema defined in `pokedb.sql`

## 📁 Project Structure

```
.
├── README.md
├── backend/
│   ├── app.py                 # Flask REST API server
│   ├── requirements.txt       # Python dependencies
├── frontend/
│   ├── index.html            # Main search page
│   ├── script.js             # Search functionality
│   ├── style.css             # Main styles
│   ├── details.html          # Details page
│   ├── details.js            # Details page logic
│   ├── details.css           # Details page styles
│   └── favicon.png           # Site icon
└── sql/
    └── pokedb.sql            # Complete database schema, views, and data
```

## 🗄 Database Schema
![Database Schema](Relational_1.png)

The `pokedb.sql` file contains:

### Tables (8)
1. **POKEMON** - Main Pokémon data (stats, generation, legendary status)
2. **TYPES** - Pokémon type definitions (18 types)
3. **POKEMON_TYPES** - Links Pokémon to their types
4. **ABILITIES** - Ability definitions and descriptions
5. **POKEMON_ABILITIES** - Links Pokémon to their abilities
6. **POKEMON_EVOLUTIONS** - Evolution relationships
7. **EVOLUTION_REQUIREMENTS** - Evolution conditions (level, item, trade, etc.)
8. **TYPE_EFFECTIVENESS** - Type matchup multipliers

### Views (2)
1. **POKEMON_MASTER_VIEW** - Combined Pokémon data with types and abilities
2. **POKEMON_DIRECT_EVOLUTIONS_VIEW** - Simplified evolution queries

### Data
- Complete Pokémon data insertion scripts included
- All relationships and constraints defined

## ✨ Features

### Search & Filter
- Search by ID or name
- Filter by type, region, generation
- Filter by legendary status
- Advanced name filters (starts with, includes, excludes, position, length)
- Advanced filters (evolution stage, catch difficulty, BST range, height/weight, abilities)
- Sort by any stat or attribute
- Dual-type only filter

### Pokémon Details
- Complete base stats with visual progress bars
- Type information with color coding
- Full ability list
- Physical characteristics (height, weight, BMI)
- Generation and region data
- Pokédex descriptions
- **Interactive evolution chain** with requirements

### User Interface
- Responsive design (mobile & desktop)
- Real-time search results
- Modal quick-view
- Smooth animations and transitions
- Type color-coded badges

## 🚀 Installation

### 1. Database Setup

#### Create Oracle User
```sql
CREATE USER pokedb IDENTIFIED BY 5687;
GRANT CONNECT, RESOURCE, CREATE VIEW TO pokedb;
GRANT UNLIMITED TABLESPACE TO pokedb;
EXIT;
```

#### Import Database Schema and Data
```bash
CONNECT pokedb/5687;
@sql/pokedb.sql

```

This will create all tables, views, and insert all Pokémon data.

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Configure Oracle Client Path

Edit `app.py` line 11-21 to match your Oracle installation:

```python
# Windows Example
oracledb.init_oracle_client(lib_dir=r"C:\oraclexe\app\oracle\product\11.2.0\server\bin")

# Linux/Mac Example  
oracledb.init_oracle_client(lib_dir="/path/to/instantclient")
```

#### Update Database Credentials (if needed)

In `app.py`, configure your connection:

```python
DB_CONFIG = {
    "user": "pokedb",
    "password": "5687",
    "dsn": "127.0.0.1:1521/xe"
}
```

#### Start Backend Server
```bash
python app.py
```

Server runs on `http://127.0.0.1:5000`

### 3. Frontend Setup

Open `frontend/index.html` in a web browser, or use a local server:

```bash
cd frontend
python -m http.server 8000
# Navigate to http://localhost:8000
```

## 💻 Usage

### Main Search Page
1. Enter Pokémon ID or name in search box
2. Use filters to narrow results (type, region, generation, etc.)
3. Click "Advanced Name Filters" or "Show Advanced Filters" for more options
4. Click any Pokémon card for quick preview
5. Click "View Full Details" for complete information

### Details Page
- View complete Pokémon stats and information
- Interactive evolution chain with clickable nodes
- Evolution requirements displayed
- Navigate between evolutions by clicking sprites

## 🔌 API Endpoints

### `GET /api/pokemon`
Returns all Pokémon with complete data from `POKEMON_MASTER_VIEW`.

### `GET /api/pokemon/<id>`
Returns detailed information for a specific Pokémon including:
- All base attributes
- Types and abilities
- Complete evolution chain (recursive tree structure)
- Evolution requirements for each evolution

## 🔧 Troubleshooting

### Oracle Connection Issues

**"DPI-1047: Cannot locate Oracle Client library"**
- Install Oracle Instant Client
- Set correct `lib_dir` path in `app.py`

**"ORA-12541: TNS:no listener"**
- Verify Oracle service is running: `lsnrctl status`
- Check connection string and port 1521

**"ORA-01017: invalid username/password"**
- Verify user `pokedb` with password `5687` exists
- Check grants: `CONNECT`, `RESOURCE`, `DBA`

### Frontend Issues

**Data not loading (spinner keeps spinning)**
- Ensure backend is running on port 5000
- Check browser console for CORS or network errors
- Verify `app.py` has `CORS(app)` enabled

## 📊 Database Details

### Verify Installation
```sql
sqlplus pokedb/5687@xe

SELECT object_type, object_name 
FROM user_objects 
WHERE object_type IN ('TABLE','VIEW') 
ORDER BY object_type, object_name;
```

Should show:
- 8 Tables
- 2 Views

### Check Data
```sql
SELECT COUNT(*) FROM pokemon;
SELECT COUNT(*) FROM pokemon_evolutions;
SELECT * FROM pokemon_master_view WHERE ROWNUM <= 5;
```

## 🎯 Key Features Explained

### Evolution Chain Algorithm
The backend recursively builds complete evolution trees:
1. Finds the root (first form) of the evolution line
2. Builds tree structure with all branches
3. Formats evolution requirements
4. Marks the current Pokémon

### Views in Action
- **POKEMON_MASTER_VIEW**: Joins Pokémon, types, and abilities for the main list
- **POKEMON_DIRECT_EVOLUTIONS_VIEW**: Simplified evolution lookups

## 📝 Requirements

### Prerequisites
- Python 3.8+
- Oracle Database 11g XE
- Oracle Instant Client (for thick mode connection)
- Modern web browser

### Python Dependencies
See `backend/requirements.txt`:
- Flask 3.1.2
- flask-cors 6.0.2
- oracledb 3.4.2

## 🤝 Contributing

Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📜 License

Educational project. Pokémon and related properties are © Nintendo/Game Freak.

---

**Built with Oracle Database 11g, Flask, and Vanilla JavaScript**
