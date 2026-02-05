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

// 2. API Fetch
async function apiFetch(path, options = {}) {
    const headers = { ...options.headers, "ngrok-skip-browser-warning": "true" };
    try {
        const response = await fetch(`${currentEndpoint}${path}`, { ...options, headers });
        if (!response.ok) throw new Error(`HTTP error!`);
        return response;
    } catch (error) {
        if (currentEndpoint === API_ENDPOINTS.primary) {
            currentEndpoint = API_ENDPOINTS.fallback;
            return await fetch(`${currentEndpoint}${path}`, { ...options, headers });
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
        container.innerHTML = `<p style="color:white;text-align:center;">Error loading data.</p>`;
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
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png">
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
            
            ${renderEvolution(p, color)}
        </div>
    `;

    setTimeout(() => {
        document.querySelectorAll('.stat-fill').forEach(bar => bar.style.width = bar.dataset.width);
        initTooltips();
    }, 100);
}

// 5. TOOLTIP LOGIC (FIXED)
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

            // Step 1: Ensure it's in the DOM
            setTimeout(() => {
                // Step 2: Accurate measurement
                requestAnimationFrame(() => {
                    const bRect = badge.getBoundingClientRect();
                    const tRect = tooltip.getBoundingClientRect();
                    
                    // Center X
                    const x = bRect.left + (bRect.width / 2) - (tRect.width / 2);
                    // Position Y (exactly 12px above badge)
                    const y = bRect.top + window.scrollY - tRect.height - 12;

                    // Use transform for hardware-accelerated, exact positioning
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

function renderEvolution(p, color) {
    if (!p.evolution_chain) return '';
    const chain = flattenChain(p.evolution_chain);
    return `<div class="info-card full-width">
        <h2>🔄 Evolution</h2>
        <div class="evo-linear">
            ${chain.map((poke, i) => `
                <div class="evo-node ${poke.id == p.id ? 'current' : ''}" onclick="window.location.href='details.html?id=${poke.id}'">
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${poke.id}.png">
                    <div class="evo-name">${poke.name}</div>
                </div>
                ${i < chain.length - 1 ? '<div class="arrow">→</div>' : ''}
            `).join('')}
        </div>
    </div>`;
}

function flattenChain(node, arr = []) {
    arr.push(node);
    if (node.evolutions && node.evolutions[0]) flattenChain(node.evolutions[0], arr);
    return arr;
}

document.addEventListener('DOMContentLoaded', loadPokemonDetails);