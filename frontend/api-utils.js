// 1. Configuration & Colors
const typeColors = {
    grass: "#78C850", fire: "#F08030", water: "#6890F0", bug: "#A8B820",
    normal: "#A8A878", poison: "#A040A0", electric: "#F8D030", ground: "#E0C068",
    fairy: "#EE99AC", fighting: "#C03028", psychic: "#F85888", rock: "#B8A038",
    ghost: "#705898", ice: "#98D8D8", dragon: "#7038F8", flying: "#A890F0",
    steel: "#B8B8D0", dark: "#705848"
};

const API_ENDPOINTS = {
    primary: 'http://localhost:5000',
    fallback: 'https://delila-wakeless-maranda.ngrok-free.dev'
};

let currentEndpoint = API_ENDPOINTS.primary;

// 2. API Fetch Logic
async function apiFetch(path, options = {}) {
    const headers = { ...options.headers, "ngrok-skip-browser-warning": "true" };
    try {
        const response = await fetch(`${currentEndpoint}${path}`, { ...options, headers });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response;
    } catch (error) {
        if (currentEndpoint === API_ENDPOINTS.primary) {
            console.warn("Switching to fallback API...");
            currentEndpoint = API_ENDPOINTS.fallback;
            const response = await fetch(`${currentEndpoint}${path}`, { ...options, headers });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response;
        }
        throw error;
    }
}

// 3. Load Data
async function loadPokemonDetails() {
    const id = new URLSearchParams(window.location.search).get('id');
    const container = document.getElementById('detail-container');

    if (!id) {
        container.innerHTML = '<p style="color:white; text-align:center;">No Pokémon ID found.</p>';
        return;
    }

    try {
        const res = await apiFetch(`/api/pokemon/${id}`);
        const p = await res.json();
        renderDetails(p);
    } catch (err) {
        console.error("Load failed:", err);
        container.innerHTML = `<p style="color:white; text-align:center;">Error loading data from ${currentEndpoint}</p>`;
    }
}

// 4. Main Render Function
function renderDetails(p) {
    const type1 = (p.type1 || "normal").toLowerCase();
    const type2 = p.type2 ? p.type2.toLowerCase() : null;
    const color = typeColors[type1] || "#777";
    
    const generationToRegion = {
        1: "Kanto", 2: "Johto", 3: "Hoenn", 4: "Sinnoh",
        5: "Unova", 6: "Kalos", 7: "Alola", 8: "Galar"
    };
    const regionName = generationToRegion[p.generation] || "Unknown";

    document.getElementById('detail-container').innerHTML = `
        <div class="detail-header" style="border-top-color: ${color};">
            <div class="header-sprite">
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png" alt="${p.name}">
            </div>
            <div class="header-info">
                <div class="pokemon-id">#${String(p.id).padStart(3, '0')}</div>
                <h1 style="color: ${color}; text-transform: capitalize;">${p.name}</h1>
                <div class="types">
                    <a href="type.html?name=${type1}" class="type-badge" style="background: ${typeColors[type1]}; text-decoration: none;">${type1}</a>
                    ${type2 ? `<a href="type.html?name=${type2}" class="type-badge" style="background: ${typeColors[type2]}; text-decoration: none;">${type2}</a>` : ''}
                </div>
            </div>
        </div>

        <div class="detail-content">
            ${renderTypeEffectiveness(p.type_effectiveness)}

            <div class="info-card">
                <h2>📋 Information</h2>
                <div class="info-grid">
                    <div class="info-item"><span class="label">Region</span><span class="value">${regionName}</span></div>
                    <div class="info-item"><span class="label">Height</span><span class="value">${p.height}m</span></div>
                    <div class="info-item"><span class="label">Weight</span><span class="value">${p.weight}kg</span></div>
                    <div class="info-item"><span class="label">Catch Rate</span><span class="value">${p.catch_rate || 'N/A'}</span></div>
                    ${p.legendary ? `<div class="info-item legendary"><span class="value">⭐ Legendary Pokémon</span></div>` : ''}
                </div>
            </div>

            <div class="info-card">
                <h2>✨ Abilities</h2>
                <div class="abilities-list">
                    ${renderAbilities(p.abilities, p.abilities_data)}
                </div>
            </div>

            <div class="info-card">
                <h2>📊 Base Stats</h2>
                <div class="stats-grid">
                    ${createStatRow('HP', p.hp, 255, color)}
                    ${createStatRow('ATK', p.attack, 190, color)}
                    ${createStatRow('DEF', p.defense, 230, color)}
                    ${createStatRow('SPA', p.sp_atk, 194, color)}
                    ${createStatRow('SPD', p.sp_def, 230, color)}
                    ${createStatRow('SPE', p.speed, 180, color)}
                    ${createStatRow('BST', p.bst, 780, '#333', true)}
                </div>
            </div>

            ${renderEvolutionSection(p, color)}
        </div>
    `;

    setTimeout(() => {
        document.querySelectorAll('.stat-fill').forEach(bar => {
            bar.style.width = bar.getAttribute('data-width');
        });
        initAbilityTooltips();
    }, 100);
}

// 5. Ability Render & Tooltips
function renderAbilities(abilities, abilities_data) {
    if (!abilities_data || abilities_data.length === 0) {
        const items = typeof abilities === 'string' ? abilities.split(',') : (abilities || []);
        return items.map(a => `<span class="ability-badge">${(typeof a === 'string' ? a : a.name).replace(/-/g, ' ')}</span>`).join('');
    }
    return abilities_data.map(a => `
        <a href="abilitie.html?id=${a.id}" 
           class="ability-badge clickable-ability" 
           data-description="${(a.description || 'No description available').replace(/"/g, '&quot;')}"
           style="text-decoration: none; cursor: pointer;">
            ${a.name.replace(/-/g, ' ')}
        </a>`).join('');
}

function initAbilityTooltips() {
    const abilities = document.querySelectorAll('.clickable-ability');
    abilities.forEach(ability => {
        ability.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'ability-tooltip';
            tooltip.textContent = ability.getAttribute('data-description');
            tooltip.id = 'active-tooltip';
            document.body.appendChild(tooltip);
            const rect = ability.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + window.scrollY + 'px';
            setTimeout(() => tooltip.classList.add('show'), 10);
        });
        ability.addEventListener('mouseleave', () => {
            const tooltip = document.getElementById('active-tooltip');
            if (tooltip) { tooltip.classList.remove('show'); setTimeout(() => tooltip.remove(), 200); }
        });
    });
}

// 6. Stats & Effectiveness
function createStatRow(label, val, max, color, isBold = false) {
    const pct = Math.min(((val || 0) / max) * 100, 100);
    return `<div class="stat-row">
        <span style="${isBold ? 'font-weight:bold' : ''}">${label}</span>
        <strong style="${isBold ? 'font-weight:bold' : ''}">${val || 0}</strong>
        <div class="stat-bar"><div class="stat-fill" style="background:${color}" data-width="${pct}%"></div></div>
    </div>`;
}

function renderTypeEffectiveness(eff) {
    if (!eff) return '';
    const mults = eff.defensive?.multipliers || eff;
    const config = [
        { val: 0, class: 'immune', label: 'Immune' },
        { val: 0.25, class: 'very-resistant', label: '4x Resist' },
        { val: 0.5, class: 'resistant', label: 'Resist' },
        { val: 2, class: 'weak', label: 'Weak' },
        { val: 4, class: 'very-weak', label: '4x Weak' }
    ];
    let html = `<div class="info-card full-width"><h2>⚔️ Defensive Matchups</h2><div class="type-effectiveness-grid">`;
    config.forEach(cfg => {
        const types = Object.keys(mults).filter(t => mults[t] === cfg.val);
        if (types.length > 0) {
            html += `<div class="effectiveness-category ${cfg.class}"><h3>${cfg.label}</h3><div class="type-badges-container">
                ${types.map(t => `<a href="type.html?name=${t}" class="type-badge type-${t}" style="text-decoration: none;">${t}</a>`).join('')}
            </div></div>`;
        }
    });
    return html + `</div></div>`;
}

// 7. ADVANCED EVOLUTION ENGINE (With Requirements)
function renderEvolutionSection(p, color) {
    const chain = p.evolution_chain || p.evolution_tree;
    if (!chain || !chain.id) return '';

    // Check if it's a branched evolution (like Eevee)
    const hasBranches = (node) => {
        if (node.evolutions && node.evolutions.length > 1) return true;
        if (node.evolutions && node.evolutions.length === 1) return hasBranches(node.evolutions[0]);
        return false;
    };

    return `
        <div class="info-card full-width">
            <h2>🔄 Evolution Chain</h2>
            <div class="evolution-tree">
                ${hasBranches(chain) ? renderBranchedEvolution(chain, p.id, color) : renderLinearEvolution(flattenChain(chain), p.id, color)}
            </div>
        </div>`;
}

function flattenChain(node, result = []) {
    if (!node) return result;
    result.push(node);
    if (node.evolutions && node.evolutions.length > 0) flattenChain(node.evolutions[0], result);
    return result;
}

function renderLinearEvolution(chain, currentId, color) {
    return `<div class="evo-linear">
        ${chain.map((poke, i) => {
            const isCurrent = poke.id == currentId;
            let html = `
                <div class="evo-node clickable ${isCurrent ? 'current' : ''}" 
                     onclick="window.location.href='details.html?id=${poke.id}'"
                     style="${isCurrent ? `border-color:${color}; box-shadow: 0 0 15px ${color}66;` : ''}">
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${poke.id}.png" width="80">
                    <div class="evo-name">${poke.name}</div>
                </div>`;
            
            if (i < chain.length - 1) {
                const req = chain[i+1].requirement || poke.evolutions?.[0]?.requirement || 'Level Up';
                html += `<div class="evo-arrow"><div class="requirement">${req}</div><div class="arrow">→</div></div>`;
            }
            return html;
        }).join('')}
    </div>`;
}

function renderBranchedEvolution(node, currentId, color) {
    const isCurrent = node.id == currentId;
    let html = `<div class="evo-stage">
        <div class="evo-node clickable ${isCurrent ? 'current' : ''}" 
             onclick="window.location.href='details.html?id=${node.id}'"
             style="${isCurrent ? `border-color:${color}; box-shadow: 0 0 15px ${color}66;` : ''}">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${node.id}.png" width="80">
            <div class="evo-name">${node.name}</div>
        </div>`;

    if (node.evolutions && node.evolutions.length > 1) {
        html += `<div class="evo-arrow-main"><div class="arrow">→</div></div><div class="evo-branches">`;
        node.evolutions.forEach(evo => {
            html += `<div class="evo-branch">
                <div class="evo-arrow-branch"><div class="requirement">${evo.requirement || 'Unknown'}</div><div class="arrow-line">→</div></div>
                ${renderSimpleNode(evo, currentId, color)}
            </div>`;
        });
        html += `</div>`;
    } else if (node.evolutions && node.evolutions.length === 1) {
        html += `<div class="evo-arrow"><div class="requirement">${node.evolutions[0].requirement || 'Level Up'}</div><div class="arrow">→</div></div>
                 ${renderBranchedEvolution(node.evolutions[0], currentId, color)}`;
    }
    return html + `</div>`;
}

function renderSimpleNode(node, currentId, color) {
    const isCurrent = node.id == currentId;
    return `<div class="evo-node clickable ${isCurrent ? 'current' : ''}" 
             onclick="window.location.href='details.html?id=${node.id}'"
             style="${isCurrent ? `border-color:${color}` : ''}">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${node.id}.png" width="80">
            <div class="evo-name">${node.name}</div>
        </div>`;
}

document.addEventListener('DOMContentLoaded', loadPokemonDetails);