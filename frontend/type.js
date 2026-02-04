const typeColors = {
    normal: "#A8A878",
    fire: "#F08030",
    water: "#6890F0",
    electric: "#F8D030",
    grass: "#78C850",
    ice: "#98D8D8",
    fighting: "#C03028",
    poison: "#A040A0",
    ground: "#E0C068",
    flying: "#A890F0",
    psychic: "#F85888",
    bug: "#A8B820",
    rock: "#B8A038",
    ghost: "#705898",
    dragon: "#7038F8",
    dark: "#705848",
    steel: "#B8B8D0",
    fairy: "#EE99AC"
};

const typeIcons = {
    normal: "⭐",
    fire: "🔥",
    water: "💧",
    electric: "⚡",
    grass: "🌿",
    ice: "❄️",
    fighting: "👊",
    poison: "☠️",
    ground: "🌍",
    flying: "🦅",
    psychic: "🔮",
    bug: "🐛",
    rock: "🪨",
    ghost: "👻",
    dragon: "🐉",
    dark: "🌑",
    steel: "⚙️",
    fairy: "🧚"
};

async function loadType() {
    const urlParams = new URLSearchParams(window.location.search);
    const typeName = urlParams.get('name');
    
    if (!typeName) {
        document.getElementById('type-container').innerHTML = `
            <p style="color:white; text-align:center;">No type specified</p>
            <a href="index.html" class="back-btn" style="display:block; text-align:center; margin-top:20px;">← Back to PokéDex</a>
        `;
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:5000/api/types/${typeName}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        renderType(data);
    } catch (err) {
        console.error("Fetch error:", err);
        document.getElementById('type-container').innerHTML = `
            <p style="color:white; text-align:center; padding:40px;">
                Failed to load type details. Error: ${err.message}
            </p>
            <a href="index.html" class="back-btn" style="display:block; text-align:center; margin-top:20px;">← Back to PokéDex</a>
        `;
    }
}

function renderType(data) {
    const container = document.getElementById('type-container');
    const typeName = data.name.toLowerCase();
    const typeColor = typeColors[typeName] || "#777";
    const typeIcon = typeIcons[typeName] || "❓";
    
    // Render effectiveness badges
    const renderTypeBadges = (types) => {
        if (!types || types.length === 0) {
            return '<p class="empty-state">None</p>';
        }
        return types.map(t => 
            `<a href="type.html?name=${t}" class="type-badge type-${t}">${t}</a>`
        ).join('');
    };
    
    // Render Pokemon cards
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
    
    const eff = data.effectiveness;
    
    container.innerHTML = `
        <a href="index.html" class="back-btn">← Back to PokéDex</a>

        <div class="type-header" style="border-top-color: ${typeColor};">
            <h1 style="color: ${typeColor};">
                <span class="type-icon" style="background: ${typeColor};">${typeIcon}</span>
                ${data.name}
            </h1>
            <span class="pokemon-count">${data.pokemon_count} Pokémon with this type</span>
        </div>

        <div class="effectiveness-section">
            <h2>⚔️ Type Effectiveness</h2>
            
            <div class="effectiveness-grid">
                <!-- Offensive -->
                <div class="effectiveness-card">
                    <h3><span class="icon">⚔️</span> Strong Against (Attack)</h3>
                    <div class="type-badges-grid">
                        ${renderTypeBadges(eff.offensive.super_effective)}
                    </div>
                </div>

                <div class="effectiveness-card">
                    <h3><span class="icon">🛡️</span> Weak Against (Attack)</h3>
                    <div class="type-badges-grid">
                        ${renderTypeBadges(eff.offensive.not_very_effective)}
                    </div>
                </div>

                <div class="effectiveness-card">
                    <h3><span class="icon">🚫</span> No Effect (Attack)</h3>
                    <div class="type-badges-grid">
                        ${renderTypeBadges(eff.offensive.no_effect)}
                    </div>
                </div>

                <!-- Defensive -->
                <div class="effectiveness-card">
                    <h3><span class="icon">💔</span> Weak To (Defense)</h3>
                    <div class="type-badges-grid">
                        ${renderTypeBadges(eff.defensive.weak_to)}
                    </div>
                </div>

                <div class="effectiveness-card">
                    <h3><span class="icon">💪</span> Resists (Defense)</h3>
                    <div class="type-badges-grid">
                        ${renderTypeBadges(eff.defensive.resistant_to)}
                    </div>
                </div>

                <div class="effectiveness-card">
                    <h3><span class="icon">✨</span> Immune To (Defense)</h3>
                    <div class="type-badges-grid">
                        ${renderTypeBadges(eff.defensive.immune_to)}
                    </div>
                </div>
            </div>
        </div>

        <div class="pokemon-section">
            <h2>Pokémon with ${data.name} Type</h2>
            <div class="pokemon-grid">
                ${pokemonCardsHTML}
            </div>
        </div>
    `;
}

// Load type when page loads
document.addEventListener('DOMContentLoaded', loadType);
