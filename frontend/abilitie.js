// API Configuration
const API_ENDPOINTS = {
    primary: 'http://127.0.0.1:5000',
    fallback: 'https://delila-wakeless-maranda.ngrok-free.dev'
};

let currentEndpoint = API_ENDPOINTS.primary;

/**
 * Fetch with automatic fallback
 */
async function apiFetch(path, options = {}) {
    const headers = {
        ...options.headers,
        "ngrok-skip-browser-warning": "true"
    };
    
    try {
        const response = await fetch(`${currentEndpoint}${path}`, {
            ...options,
            headers
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response;
    } catch (error) {
        if (currentEndpoint === API_ENDPOINTS.primary) {
            console.warn(`Primary API failed, switching to fallback: ${error.message}`);
            currentEndpoint = API_ENDPOINTS.fallback;
            
            try {
                const response = await fetch(`${currentEndpoint}${path}`, {
                    ...options,
                    headers
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                return response;
            } catch (fallbackError) {
                console.error('Fallback API also failed:', fallbackError);
                throw fallbackError;
            }
        }
        
        throw error;
    }
}

async function loadAbility() {
    const urlParams = new URLSearchParams(window.location.search);
    const abilityId = urlParams.get('id');
    
    if (!abilityId) {
        document.getElementById('ability-container').innerHTML = `
            <p style="color:white; text-align:center;">No ability ID provided</p>
            <a href="abilities-list.html" class="back-btn" style="display:block; text-align:center; margin-top:20px;">← Back to Abilities</a>
        `;
        return;
    }

    try {
        const res = await apiFetch(`/api/abilities/${abilityId}`);
        const data = await res.json();
        
        // Sort Pokemon by ID
        data.pokemon.sort((a, b) => a.id - b.id);
        
        renderAbility(data);
    } catch (err) {
        console.error("Fetch error:", err);
        document.getElementById('ability-container').innerHTML = `
            <p style="color:white; text-align:center; padding:40px;">
                Failed to load ability details. Error: ${err.message}
            </p>
            <a href="abilities-list.html" class="back-btn" style="display:block; text-align:center; margin-top:20px;">← Back to Abilities</a>
        `;
    }
}

function renderAbility(data) {
    const container = document.getElementById('ability-container');
    
    const pokemonCardsHTML = data.pokemon.map(p => {
        const img = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`;
        const idFormatted = String(p.id).padStart(3, '0');
        
        return `
            <a href="details.html?id=${p.id}" class="pokemon-card">
                <img src="${img}" alt="${p.name}" loading="lazy">
                <div class="pokemon-id">#${idFormatted}</div>
                <div class="pokemon-name">${p.name}</div>
                <div class="type-badges">
                    <span class="type-badge type-${p.type1.toLowerCase()}">${p.type1}</span>
                    ${p.type2 ? `<span class="type-badge type-${p.type2.toLowerCase()}">${p.type2}</span>` : ''}
                </div>
            </a>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="ability-header">
            <h1 style="text-transform: capitalize;">${data.name}</h1>
            <p class="ability-description">${data.description || 'No description available.'}</p>
            <span class="pokemon-count">${data.pokemon_count} Pokémon have this ability</span>
        </div>

        <div class="pokemon-section">
            <h2>Pokémon with ${data.name}</h2>
            <div class="pokemon-grid">
                ${pokemonCardsHTML}
            </div>
        </div>
    `;
}

// Load ability when page loads
document.addEventListener('DOMContentLoaded', loadAbility);