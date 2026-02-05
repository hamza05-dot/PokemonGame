// 1. Configuration & Colors
const typeColors = {
    grass: "#78C850", fire: "#F08030", water: "#6890F0", bug: "#A8B820",
    normal: "#A8A878", poison: "#A040A0", electric: "#F8D030", ground: "#E0C068",
    fairy: "#EE99AC", fighting: "#C03028", psychic: "#F85888", rock: "#B8A038",
    ghost: "#705898", ice: "#98D8D8", dragon: "#7038F8", flying: "#A890F0",
    steel: "#B8B8D0", dark: "#705848"
};

const API_ENDPOINTS = {
    primary: 'http://127.0.0.1:5000',
    fallback: 'https://delila-wakeless-maranda.ngrok-free.dev'
};

let currentEndpoint = API_ENDPOINTS.primary;

// 2. API Fetch with proper async fallback handling
async function apiFetch(path, options = {}) {
    const headers = { ...options.headers, "ngrok-skip-browser-warning": "true" };
    try {
        const response = await fetch(`${currentEndpoint}${path}`, { ...options, headers });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response;
    } catch (error) {
        if (currentEndpoint === API_ENDPOINTS.primary) {
            console.warn("Primary API failed, switching to fallback...");
            currentEndpoint = API_ENDPOINTS.fallback;
            // Await the second attempt
            const response = await fetch(`${currentEndpoint}${path}`, { ...options, headers });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response;
        }
        throw error;
    }
}

// 3. Load Logic
async function loadPokemonDetails() {
    const id = new URLSearchParams(window.location.search).get('id');
    const container = document.getElementById('detail-container');
    if (!id) return;

    try {
        const res = await apiFetch(`/api/pokemon/${id}`);
        const p = await res.json();
        renderDetails(p);
    } catch (err) {
        console.error("Load failed:", err);
        container.innerHTML = `<p style="color:white;text-align:center;">Error loading data from API.</p>`;
    }
}

// 4. Render Details
function renderDetails(p) {
    const type1 = (p.type1 || "normal").toLowerCase();
    const type2 = p.type2 ? p.type2.toLowerCase() : null;
    const color = typeColors[type1] || "#777";

    document.getElementById('detail-container').innerHTML = `
        <div class="detail-header" style="border-top-color: ${color};">
            <div class="header-sprite">
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png" alt="${p.name}">
            </div>
            <div class="header-info">
                <div class="pokemon-id">#${String(p.id).padStart(3, '0')}</div>
                <h1 style="color: ${color}">${p.name}</h1>
                <div class="types">
                    <span class="type-badge" style="background:${typeColors[type1]}">${type1}</span>
                    ${type2 ? `<span class="type-badge" style="background:${typeColors[type2]}">${type2}</span>` : ''}
                </div>
            </div>
        </div>

        <div class="detail-content">
            <div class="info-card">
                <h2>📋 Info</h2>
                <div class="info-grid">
                    <div class="info-item"><span>Height</span><span>${p.height}m</span></div>
                    <div class="info-item"><span>Weight</span><span>${p.weight}kg</span></div>
                </div>
            </div>

            <div class="info-card">
                <h2>✨ Abilities</h2>
                <div class="abilities-list">
                    ${p.abilities_data.map(a => `
                        <a href="abilitie.html?id=${a.id}" class="ability-badge clickable-ability" data-desc="${a.description}">
                            ${a.name.replace(/-/g, ' ')}
                        </a>`).join('')}
                </div>
            </div>

            <div class="info-card full-width">
                <h2>📊 Stats</h2>
                <div class="stats-grid">
                    ${createStatRow('HP', p.hp, 255, color)}
                    ${createStatRow('ATK', p.attack, 190, color)}
                    ${createStatRow('DEF', p.defense, 230, color)}
                </div>
            </div>
            
            ${renderEvolutionSection(p, color)}
        </div>
    `;

    setTimeout(() => {
        document.querySelectorAll('.stat-fill').forEach(bar => bar.style.width = bar.dataset.width);
        initTooltips();
    }, 100);
}

// 5. TOOLTIP LOGIC (FIXED POSITIONING)
function initTooltips() {
    const badges = document.querySelectorAll('.clickable-ability');
    
    badges.forEach(badge => {
        badge.addEventListener('mouseenter', () => {
            const existing = document.getElementById('active-tooltip');
            if (existing) existing.remove();

            const tooltip = document.createElement('div');
            tooltip.className = 'ability-tooltip';
            tooltip.id = 'active-tooltip';
            tooltip.textContent = badge.dataset.desc;
            document.body.appendChild(tooltip);

            setTimeout(() => {
                requestAnimationFrame(() => {
                    const bRect = badge.getBoundingClientRect();
                    const tRect = tooltip.getBoundingClientRect();
                    
                    const x = bRect.left + (bRect.width / 2) - (tRect.width / 2);
                    const y = bRect.top + window.scrollY - tRect.height - 12;

                    tooltip.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                    tooltip.classList.add('show');
                });
            }, 0);
        });

        badge.addEventListener('mouseleave', () => {
            const tooltip = document.getElementById('active-tooltip');
            if (tooltip) {
                tooltip.classList.remove('show');
                setTimeout(() => tooltip.remove(), 150);
            }
        });
    });
}

function createStatRow(label, val, max, color) {
    const pct = (val / max) * 100;
    return `<div class="stat-row">
        <span>${label}</span><strong>${val}</strong>
        <div class="stat-bar"><div class="stat-fill" style="background:${color}" data-width="${pct}%"></div></div>
    </div>`;
}

// 6. EVOLUTION LOGIC (HANDLES BRANCHES)
function renderEvolutionSection(p, color) {
    if (!p.evolution_chain) return '';
    return `
        <div class="info-card full-width">
            <h2>🔄 Evolution</h2>
            <div class="evolution-tree">
                ${renderEvolutionBranch(p.evolution_chain, p.id, color)}
            </div>
        </div>`;
}

function renderEvolutionBranch(node, currentId, color) {
    const isCurrent = node.id == currentId;
    let html = `<div class="evo-stage">
        <div class="evo-node ${isCurrent ? 'current' : ''}" 
             onclick="window.location.href='details.html?id=${node.id}'"
             style="${isCurrent ? `border-color:${color}` : ''}">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${node.id}.png" width="80">
            <div class="evo-name">${node.name}</div>
        </div>`;

    if (node.evolutions && node.evolutions.length > 0) {
        if (node.evolutions.length > 1) {
            // Branched (like Eevee)
            html += `<div class="arrow">→</div><div class="evo-branches">`;
            node.evolutions.forEach(evo => {
                html += `<div class="evo-branch">
                    <div class="requirement">${evo.requirement || 'Special'}</div>
                    ${renderEvolutionBranch(evo, currentId, color)}
                </div>`;
            });
            html += `</div>`;
        } else {
            // Linear
            html += `<div class="arrow">→</div>`;
            html += renderEvolutionBranch(node.evolutions[0], currentId, color);
        }
    }
    return html + `</div>`;
}

document.addEventListener('DOMContentLoaded', loadPokemonDetails);