# 🔍 PokéSearch - Advanced Pokémon Database System

<div align="center">

![PokéSearch Banner](./docs/images/banner.png)

**A full-stack web application for exploring comprehensive Pokémon data with Oracle 11g backend and modern JavaScript frontend**

[![Oracle](https://img.shields.io/badge/Oracle-11g_XE-F80000?style=for-the-badge&logo=oracle&logoColor=white)](https://www.oracle.com/database/technologies/xe-prior-releases.html)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.1.2-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

[Features](#-features) • [Screenshots](#-screenshots) • [Quick Start](#-quick-start) • [Tech Stack](#-technology-stack) • [Documentation](#-documentation)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Quick Start](#-quick-start)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Database Architecture](#-database-architecture)
- [Installation Methods](#-installation-methods)
- [Docker Deployment](#-docker-deployment)
- [Ngrok Integration](#-ngrok-integration)
- [API Documentation](#-api-documentation)
- [Future Enhancements](#-future-enhancements)

---

## 🌟 Overview

**PokéSearch** is a comprehensive web-based Pokémon information system that provides an intuitive interface for searching, filtering, and exploring detailed information about all Pokémon. Built with Oracle 11g database, Flask REST API, and vanilla JavaScript, this application demonstrates full-stack development with enterprise-grade database management.

### Key Highlights

✅ **Complete Pokémon Data** - All 8 generations with 1000+ Pokémon  
✅ **Advanced Filtering** - 15+ filter options including name patterns, stats ranges, abilities  
✅ **Interactive Evolution Trees** - Visual representation with evolution requirements  
✅ **Type Effectiveness** - Complete offensive/defensive matchup calculations  
✅ **Responsive Design** - Works flawlessly on desktop, tablet, and mobile devices  
✅ **Docker Ready** - One-command deployment with docker-compose  
✅ **API Fallback** - Automatic switching between localhost and ngrok endpoints  
✅ **Real-time Search** - Instant results as you type with no page reload  

---

## ⚡ Features

### 🔎 Advanced Search & Filtering

![Search Interface](./docs/images/search-interface.png)

**Basic Filters:**
- 🔢 **ID/Name Search** - Search by Pokédex number or name
- ⚡ **Type Filter** - Filter by any of 18 Pokémon types
- 🗺️ **Region Filter** - Browse by Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar
- 🎮 **Generation Filter** - Select specific generations (1-8)
- ⭐ **Legendary Filter** - Show only legendary or non-legendary Pokémon

**Advanced Name Filters:**
- ▶️ **Starts With** - Find Pokémon starting with specific letter
- 🔍 **Includes Letters** - Must contain certain letters
- 🚫 **Excludes** - Cannot contain specified letters
- 📍 **Position Match** - Specific characters at positions (e.g., `_ i _ a _ _`)
- 📏 **Name Length** - Filter by exact name length

**Advanced Filters:**
- 🔄 **Evolution Stage** - Basic, mid-evolution, or final forms
- 📊 **BST Range** - Filter by total base stats (min/max)
- 📏 **Height Range** - Physical height filtering
- ⚖️ **Weight Range** - Physical weight filtering
- 💪 **Ability Search** - Find Pokémon with specific abilities
- 🎯 **Catch Difficulty** - Easy (100+), Medium (50-99), Hard (0-49)
- 🔀 **Dual-Type Only** - Show only Pokémon with two types

### 📊 Sorting Options (Ascending/Descending)

- 🔢 **Pokédex ID** 
- 🔤 **Name** (A-Z or Z-A)
- ❤️ **HP, Attack, Defense, Sp. Atk, Sp. Def, Speed**
- 💪 **Total Base Stats (BST)**
- 📏 **Height and Weight**
- 🎣 **Catch Rate**

### 📱 Pokémon Details Page

![Details Page](./docs/images/details-page.png)

- **Complete Stats Display** with animated progress bars
- **Type Information** with color-coded clickable badges
- **Abilities List** with descriptions and hover tooltips
- **Physical Characteristics**: Height, Weight, BMI, Catch Rate
- **Generation & Region** information
- **Pokédex Description**
- **Type Effectiveness Calculator** showing:
  - Immune types (0x damage)
  - Very Resistant (0.25x damage)
  - Resistant (0.5x damage)
  - Weak (2x damage)
  - Very Weak (4x damage)
- **Interactive Evolution Chain**:
  - Visual tree structure
  - Evolution requirements (level, stones, items, trade, friendship)
  - Clickable sprites to navigate
  - Branching evolution support (Eevee, Tyrogue, etc.)

### 🎨 Type Explorer

![Type Page](./docs/images/type-page.png)

- Browse all 18 Pokémon types with custom icons
- View complete type effectiveness charts
- See all Pokémon of each type (sorted by Pokédex ID)
- Offensive and defensive matchup visualizations
- Clickable type badges for easy navigation

### 💪 Ability Browser

![Abilities Page](./docs/images/abilities-page.png)

- Complete ability database (300+ abilities)
- Searchable by name or description
- View all Pokémon with each ability (sorted by ID)
- Detailed ability descriptions
- Sortable A-Z or Z-A

---

## 📸 Screenshots

<table>
<tr>
<td width="50%">

### Main Search Interface
![Search](./docs/images/screenshot-search.png)
*Advanced filtering with real-time results*

</td>
<td width="50%">

### Pokémon Details
![Details](./docs/images/screenshot-details.png)
*Complete information with stats and evolution*

</td>
</tr>
<tr>
<td width="50%">

### Type Effectiveness
![Types](./docs/images/screenshot-types.png)
*Visual type matchups and Pokémon lists*

</td>
<td width="50%">

### Mobile Responsive
![Mobile](./docs/images/screenshot-mobile.png)
*Fully responsive design for mobile devices*

</td>
</tr>
</table>

### Evolution Tree Example
![Evolution](./docs/images/screenshot-evolution.png)
*Interactive evolution chains with clickable nodes and requirements*

---

## 🚀 Quick Start

### Option 1: Docker (Recommended - Easiest)

```bash
# 1. Clone repository
git clone https://github.com/yourusername/pokemon-search.git
cd pokemon-search

# 2. Start all services
docker-compose up -d

# 3. Import database
./import_data.bat  # Windows
./import_data.sh   # Linux/Mac

# 4. Access application
# Open browser: http://localhost
```

### Option 2: Local Development

```bash
# 1. Setup Oracle Database
sqlplus sys/password@xe as sysdba
CREATE USER pokedb IDENTIFIED BY 5687;
GRANT CONNECT, RESOURCE, DBA TO pokedb;
EXIT;

# 2. Import schema
sqlplus pokedb/5687@xe
@sql/pokedb.sql
EXIT;

# 3. Start backend
cd backend
pip install -r requirements.txt
python app.py

# 4. Start frontend
cd frontend
python -m http.server 8000
```

**Access:** http://localhost:8000

---

## 🛠 Technology Stack

### Backend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.8+ | Backend programming language |
| **Flask** | 3.1.2 | Web framework & REST API server |
| **Flask-CORS** | 6.0.2 | Cross-origin resource sharing |
| **python-oracledb** | 3.4.2 | Oracle database driver (thick mode) |
| **Oracle Database** | 11g XE | Enterprise relational database |
| **python-dotenv** | 1.0.1 | Environment variable management |

### Frontend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| **HTML5** | - | Semantic structure |
| **CSS3** | - | Styling with animations |
| **JavaScript** | ES6+ | Client-side logic and interactivity |
| **Fetch API** | - | Asynchronous HTTP requests |

### DevOps & Deployment

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Docker** | Latest | Container platform |
| **Docker Compose** | v3.8 | Multi-container orchestration |
| **Nginx** | Alpine | Web server & reverse proxy |
| **Ngrok** | Latest | Secure tunneling service |

### Development Tools

- **Git** - Version control system
- **VS Code** - Code editor
- **Postman** - API testing tool
- **SQL Developer** - Oracle database management
- **Chrome DevTools** - Frontend debugging

---

## 📁 Project Structure

```
pokemon-search/
│
├── 📂 docs/                          # Documentation
│   └── 📂 images/                    # Screenshots & diagrams
│       ├── banner.png
│       ├── database-schema.png       # ER diagram
│       └── *.png                     # All other screenshots
│
├── 📂 backend/                       # Flask API Server
│   ├── app.py                        # Main application
│   ├── requirements.txt              # Dependencies
│   └── Dockerfile                    # Container config
│
├── 📂 frontend/                      # Web Interface
│   ├── *.html                        # HTML pages
│   ├── *.css                         # Stylesheets
│   ├── *.js                          # JavaScript
│   ├── nginx.conf                    # Web server config
│   └── Dockerfile                    # Container config
│
├── 📂 sql/                           # Database Scripts
│   └── pokedb.sql                    # Schema & data
│
├── 📂 database/                      # Backups
│   └── pokemon_backup.dmp            # Oracle export
│
├── docker-compose.yml                # Orchestration
├── .env                              # Environment variables
├── .gitignore                        # Git ignore rules
├── .dockerignore                     # Docker ignore rules
├── import_data.bat                   # Data import (Windows)
├── README.md                         # This file
└── LICENSE                           # MIT License
```

**For detailed structure:** See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

---

## 🗄 Database Architecture

![Database Schema](./docs/images/database-schema.png)

### Tables (8 Total)

| Table | Records | Purpose |
|-------|---------|---------|
| **POKEMON** | 1000+ | Core Pokémon data (stats, generation, legendary) |
| **TYPES** | 18 | Type definitions (Fire, Water, Grass, etc.) |
| **POKEMON_TYPES** | 1500+ | Maps Pokémon to their types (supports dual-types) |
| **ABILITIES** | 300+ | Ability definitions and descriptions |
| **POKEMON_ABILITIES** | 2000+ | Maps Pokémon to their abilities |
| **POKEMON_EVOLUTIONS** | 500+ | Evolution relationships (from → to) |
| **EVOLUTION_REQUIREMENTS** | 500+ | Evolution conditions (level, item, trade, etc.) |
| **TYPE_EFFECTIVENESS** | 324 | Type matchup multipliers (18×18) |

### Views (2 Total)

1. **POKEMON_MASTER_VIEW** - Joins Pokémon with types, abilities, and stats
2. **POKEMON_DIRECT_EVOLUTIONS_VIEW** - Simplified evolution lookups

### Key Features

- ✅ **Referential Integrity** - Foreign key constraints ensure data consistency
- ✅ **Normalized Design** - 3rd Normal Form (3NF) minimizes redundancy
- ✅ **Indexed Columns** - Fast queries on ID, name, type, ability
- ✅ **Complex Relationships** - Supports dual-types, multiple abilities, branching evolutions
- ✅ **JSON Storage** - Evolution data stored as JSON for flexible tree structures

---

## 💻 Installation Methods

### Method 1: Docker (Recommended)

**Advantages:**
- ✅ No manual Oracle installation
- ✅ Consistent environment
- ✅ One-command deployment
- ✅ Easy to share and reproduce

**Steps:**

```bash
# Clone
git clone https://github.com/yourusername/pokemon-search.git
cd pokemon-search

# Configure
echo "DB_USER=pokedb" > .env
echo "DB_PASSWORD=5687" >> .env
echo "DB_SID=xe" >> .env

# Deploy
docker-compose up -d

# Import data
./import_data.bat
```

### Method 2: Local Setup

**Advantages:**
- ✅ Full control over environment
- ✅ Easier debugging
- ✅ No Docker overhead

**Steps:**

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

---

## 🐳 Docker Deployment

### Architecture

```
┌─────────────────────────────────────┐
│   Frontend (Nginx - Port 80)        │
│   ├─ Serves HTML/CSS/JS             │
│   └─ Proxies /api/* to backend      │
└──────────────┬──────────────────────┘
               │ HTTP
               ▼
┌─────────────────────────────────────┐
│   Backend (Flask - Port 5000)       │
│   ├─ REST API endpoints             │
│   └─ Business logic                 │
└──────────────┬──────────────────────┘
               │ TCP/IP
               ▼
┌─────────────────────────────────────┐
│   Database (Oracle - Port 1521)     │
│   ├─ Data storage                   │
│   └─ SQL queries                    │
└─────────────────────────────────────┘
```

### Docker Compose Services

**1. oracle-db** - Oracle Database 11g XE
- Image: `wnameless/oracle-xe-11g-r2`
- Port: 1522:1521 (mapped to avoid conflicts)
- Volume: `oracle-data` for persistence

**2. backend** - Flask API
- Built from: `./backend/Dockerfile`
- Port: 5000:5000
- Depends on: oracle-db
- Environment: Database credentials from `.env`

**3. frontend** - Nginx Web Server
- Built from: `./frontend/Dockerfile`
- Port: 80:80
- Depends on: backend
- Config: Custom nginx.conf for API proxying

### Deployment Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# View running containers
docker-compose ps

# Access database
docker exec -it pokemon_oracle_db sqlplus pokedb/5687@xe

# Access backend shell
docker exec -it pokemon_backend sh

# Access frontend shell
docker exec -it pokemon_frontend sh
```

### Data Persistence

Data persists across container restarts using Docker volumes:

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect pokemon-search_oracle-data

# Backup volume
docker run --rm \
  -v pokemon-search_oracle-data:/data \
  -v $(pwd):/backup \
  ubuntu tar czf /backup/oracle-backup.tar.gz /data
```

---

## 🌐 Ngrok Integration

### What is Ngrok?

Ngrok creates secure tunnels from public internet to your localhost, enabling:

- 📱 **Mobile Testing** - Test on real devices without deployment
- 🌍 **Remote Access** - Access your local server from anywhere
- 🔗 **API Sharing** - Share your work with team/clients
- 🔔 **Webhook Testing** - Receive webhooks from external services

### Why We Use Ngrok

1. **Development Flexibility** - Test on multiple devices simultaneously
2. **No Deployment Needed** - Share progress without pushing to production
3. **Automatic Fallback** - App switches to ngrok if localhost fails
4. **Real-World Testing** - Test with actual internet latency

### Setup Instructions

#### 1. Install Ngrok

**Windows (Chocolatey):**
```bash
choco install ngrok
```

**macOS (Homebrew):**
```bash
brew install ngrok
```

**Linux:**
```bash
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin
```

#### 2. Get Auth Token

1. Sign up at https://ngrok.com (free)
2. Copy auth token from dashboard
3. Configure ngrok:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

#### 3. Start Tunnel

```bash
# Tunnel to backend API
ngrok http 5000
```

**Output:**
```
Session Status    online
Forwarding        https://abc123-def456.ngrok-free.app -> http://localhost:5000
```

#### 4. Update Frontend

In all JS files (`script.js`, `details.js`, `type.js`, `abilitie.js`):

```javascript
const API_ENDPOINTS = {
    primary: 'http://127.0.0.1:5000',
    fallback: 'https://abc123-def456.ngrok-free.app'  // Your ngrok URL
};
```

### How API Fallback Works

```javascript
async function apiFetch(path, options = {}) {
    const headers = {
        ...options.headers,
        "ngrok-skip-browser-warning": "true"  // Bypass ngrok warning
    };
    
    try {
        // 1. Try localhost first (fast, no latency)
        const response = await fetch(`${API_ENDPOINTS.primary}${path}`, {
            ...options,
            headers
        });
        
        if (!response.ok) throw new Error();
        return response;
        
    } catch (error) {
        // 2. If local fails, automatically switch to ngrok
        console.warn('Switching to ngrok fallback');
        
        const response = await fetch(`${API_ENDPOINTS.fallback}${path}`, {
            ...options,
            headers
        });
        
        return response;
    }
}
```

### Ngrok Web Interface

Monitor all requests in real-time:

```
http://127.0.0.1:4040
```

Features:
- Request/response inspection
- Replay requests
- Performance metrics
- Traffic filtering

### Important Notes

**Free Tier Limitations:**
- ⏰ URL changes every restart
- ⌛ 2-hour session timeout
- 🔢 40 connections/minute

**Paid Tier Benefits ($):**
- 🔗 Custom subdomain (e.g., `pokemon.ngrok.io`)
- ♾️ No connection limits
- 📊 Advanced analytics

---

## 📡 API Documentation

### Base URL

```
Local:  http://localhost:5000/api
Ngrok:  https://your-ngrok-url.ngrok-free.app/api
```

### Endpoints

#### 1. Get All Pokémon

```http
GET /api/pokemon
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "bulbasaur",
    "type1": "Grass",
    "type2": "Poison",
    "hp": 45,
    "attack": 49,
    "defense": 49,
    "sp_atk": 65,
    "sp_def": 65,
    "speed": 45,
    "bst": 318,
    "generation": 1,
    "legendary": 0,
    "height": 0.7,
    "weight": 6.9,
    "catch_rate": 45,
    "abilities": "Overgrow, Chlorophyll"
  }
]
```

#### 2. Get Pokémon by ID

```http
GET /api/pokemon/:id
```

**Example:** `GET /api/pokemon/25`

**Response:**
```json
{
  "id": 25,
  "name": "pikachu",
  "type1": "Electric",
  "type2": null,
  "description": "When several of these POKéMON gather...",
  "evolution_chain": {
    "id": 172,
    "name": "pichu",
    "evolutions": [
      {
        "id": 25,
        "name": "pikachu",
        "requirement": "Friendship",
        "evolutions": [
          {
            "id": 26,
            "name": "raichu",
            "requirement": "Thunder Stone"
          }
        ]
      }
    ]
  },
  "type_effectiveness": {
    "defensive": {
      "multipliers": {
        "ground": 2,
        "electric": 0.5,
        "flying": 0.5,
        "steel": 0.5
      }
    }
  }
}
```

#### 3. Get All Types

```http
GET /api/types
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Normal",
    "pokemon_count": 98
  },
  {
    "id": 2,
    "name": "Fire",
    "pokemon_count": 64
  }
]
```

#### 4. Get Type Details

```http
GET /api/types/:name
```

**Example:** `GET /api/types/fire`

#### 5. Get All Abilities

```http
GET /api/abilities
```

#### 6. Get Ability Details

```http
GET /api/abilities/:id
```

**Example:** `GET /api/abilities/65`

### Error Responses

```json
{
  "error": "Pokémon not found"
}
```

**Status Codes:**
- `200` - Success
- `404` - Resource not found
- `500` - Server error

---

## 🔮 Future Enhancements

### Phase 1: User Features

- [ ] **User Authentication**
  - JWT-based login/signup
  - User profiles
  - Session management

- [ ] **Favourites System**
  - Save favorite Pokémon
  - Create custom lists
  - Share lists with others

- [ ] **Team Builder**
  - Create teams of 6
  - Type coverage analysis
  - Weakness calculator
  - Save multiple teams

### Phase 2: Enhanced Data

- [ ] **Move Database**
  - All Pokémon moves
  - Move details (power, accuracy, PP)
  - Learn methods (level, TM, egg)
  - Move effectiveness calculator

- [ ] **Battle Simulator**
  - Turn-based battles
  - Damage calculator
  - AI opponent
  - Battle history

### Phase 3: Advanced Features

- [ ] **Pokémon Comparison**
  - Side-by-side stats
  - Type matchup comparison
  - Visual charts

- [ ] **Nature & IV Calculator**
  - Nature effects on stats
  - IV calculator
  - EV tracking

- [ ] **Shiny Variants**
  - Shiny sprite display
  - Shiny odds calculator
  - Shiny tracking

### Phase 4: Technical Improvements

- [ ] **Progressive Web App (PWA)**
  - Offline functionality
  - Install as app
  - Push notifications

- [ ] **Performance Optimization**
  - Redis caching
  - CDN for images
  - API response compression

- [ ] **GraphQL API**
  - Flexible queries
  - Reduced over-fetching

- [ ] **Internationalization**
  - Multi-language support
  - Localized names

---

## 🔧 Troubleshooting

### Common Issues

#### Oracle Connection Errors

**"DPI-1047: Cannot locate Oracle Client library"**

```bash
# Solution: Update lib_dir in app.py
oracledb.init_oracle_client(lib_dir="/path/to/instantclient")
```

**"ORA-12541: TNS:no listener"**

```bash
# Check Oracle service
lsnrctl status

# Start if stopped
lsnrctl start
```

#### Docker Issues

**Containers won't start:**

```bash
# Check logs
docker-compose logs -f

# Recreate containers
docker-compose down
docker-compose up -d --build
```

**Database connection timeout:**

```bash
# Oracle takes 1-2 minutes to initialize
# Wait and check logs
docker-compose logs -f oracle-db
```

#### Frontend Issues

**API not loading:**

1. Verify backend: `curl http://localhost:5000/api/pokemon`
2. Check CORS in app.py: `CORS(app)`
3. Open browser console (F12) for errors

---

## 📄 License

This project is licensed under the MIT License.

### Acknowledgments

- **Nintendo/Game Freak** - Pokémon franchise
- **PokeAPI** - Sprite images
- **Oracle Database** - Enterprise database
- **Flask Community** - Web framework
- **Open Source Community** - Tools and libraries

---

## 📞 Contact

**Developer:** Your Name  
**Email:** your.email@example.com  
**GitHub:** [@yourusername](https://github.com/yourusername)  
**LinkedIn:** [your-profile](https://linkedin.com/in/your-profile)

### Project Links

🌐 **Live Demo:** https://your-demo-url.com  
📁 **Repository:** https://github.com/yourusername/pokemon-search  
🐛 **Issues:** https://github.com/yourusername/pokemon-search/issues  

---

<div align="center">

**Made with ❤️ and ☕**

*Gotta query 'em all!* 🔍⚡

[![Stars](https://img.shields.io/github/stars/yourusername/pokemon-search?style=social)](https://github.com/yourusername/pokemon-search/stargazers)
[![Forks](https://img.shields.io/github/forks/yourusername/pokemon-search?style=social)](https://github.com/yourusername/pokemon-search/network/members)

</div>
