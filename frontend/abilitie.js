async function loadAbility() {
    const urlParams = new URLSearchParams(window.location.search);
    const abilityId = urlParams.get('id');
    
    if (!abilityId) {
        document.getElementById('ability-container').innerHTML = `
            <p style="color:white; text-align:center;">No ability ID provided</p>
            <a href="index.html" class="back-btn" style="display:block; text-align:center; margin-top:20px;">← Back to Pokédex</a>
        `;
        return;
    }

    try {
        // Updated URL to fetch specific ability and fixed variable reference
        const res = await fetch(`https://delila-wakeless-maranda.ngrok-free.dev/api/abilities/${abilityId}`, {
            headers: {
                "ngrok-skip-browser-warning": "true"
            }
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        renderAbility(data);
    } catch (err) {
        console.error("Fetch error:", err);
        document.getElementById('ability-container').innerHTML = `
            <p style="color:white; text-align:center; padding:40px;">
                Failed to load ability details. Error: ${err.message}
            </p>
            <a href="index.html" class="back-btn" style="display:block; text-align:center; margin-top:20px;">← Back to Pokédex</a>
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
        <a href="index.html" class="back-btn">← Back to Pokédex</a>

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