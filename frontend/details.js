const typeColors = {
    grass: "#78C850", fire: "#F08030", water: "#6890F0", bug: "#A8B820",
    normal: "#A8A878", poison: "#A040A0", electric: "#F8D030", ground: "#E0C068",
    fairy: "#EE99AC", fighting: "#C03028", psychic: "#F85888", rock: "#B8A038",
    ghost: "#705898", ice: "#98D8D8", dragon: "#7038F8", flying: "#A890F0",
    steel: "#B8B8D0", dark: "#705848"
};

async function loadPokemon() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) {
        document.getElementById('detail-container').innerHTML = '<p style="color:white;">No Pokemon ID provided</p>';
        return;
    }

    try {
        // Fixed: Use the specific ID in the URL and match the variable name 'res'
        const res = await fetch(`https://delila-wakeless-maranda.ngrok-free.dev/api/pokemon/${id}`, {
            headers: {
                "ngrok-skip-browser-warning": "true"
            }
        });
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        renderDetails(data);
    } catch (err) {
        console.error("Fetch error:", err);
        document.getElementById('detail-container').innerHTML = `
            <p style="color:white; text-align:center; padding:40px;">
                Failed to load Pokemon details. Error: ${err.message}
            </p>
        `;
    }
}

function renderDetails(p) {
    const name = p.name || "Unknown";
    const id = p.id || 0;
    const type1 = (p.type1 || "normal").toLowerCase();
    const type2 = p.type2 ? p.type2.toLowerCase() : null;
    const color = typeColors[type1] || "#777";
    
    const apiImg = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
    const localImg = `./images/${id}.png`;

    document.getElementById('detail-container').innerHTML = `
        <div class="detail-header" style="border-top-color: ${color};">
            <div class="header-sprite">
                <img src="${apiImg}" onerror="this.onerror=null; this.src='${localImg}';">
            </div>
            <div class="header-info">
                <div class="pokemon-id">#${String(id).padStart(3, '0')}</div>
                <h1 style="color: ${color}; text-transform: capitalize;">${name}</h1>
                <div class="types">
                    <span class="type-badge" 
                          style="background: ${typeColors[type1]}; cursor: pointer;" 
                          onclick="window.location.href='type.html?name=${type1}'">
                        ${type1}
                    </span>
                    ${type2 ? `
                    <span class="type-badge" 
                          style="background: ${typeColors[type2]}; cursor: pointer;" 
                          onclick="window.location.href='type.html?name=${type2}'">
                        ${type2}
                    </span>` : ''}
                </div>
            </div>
        </div>

        <div class="detail-content">
            ${renderTypeEffectiveness(p.type_effectiveness)}

            <div class="info-card">
                <h2>📋 Information</h2>
                <div class="info-grid">
                    <div class="info-item"><span class="label">Generation:</span><span class="value">Gen ${p.generation || '?'}</span></div>
                    <div class="info-item"><span class="label">Region:</span><span class="value">${p.region || 'Unknown'}</span></div>
                    <div class="info-item"><span class="label">Height:</span><span class="value">${p.height ? (p.height).toFixed(1) + ' m' : 'N/A'}</span></div>
                    <div class="info-item"><span class="label">Weight:</span><span class="value">${p.weight ? (p.weight).toFixed(1) + ' kg' : 'N/A'}</span></div>
                    <div class="info-item"><span class="label">BMI:</span><span class="value">${p.bmi ? p.bmi.toFixed(2) : 'N/A'}</span></div>
                    <div class="info-item"><span class="label">Catch Rate:</span><span class="value">${p.catch_rate || 'N/A'}</span></div>
                    ${p.legendary === 1 ? '<div class="info-item legendary"><span class="label">✨ Legendary</span></div>' : ''}
                </div>
            </div>

            ${p.abilities_data && p.abilities_data.length > 0 ? `
                <div class="info-card">
                    <h2>⚡ Abilities</h2>
                    <div class="abilities-list">
                        ${p.abilities_data.map(a => `
                            <span class="ability-badge clickable-ability" 
                                  onclick="window.location.href='abilitie.html?id=${a.id}'"
                                  data-description="${(a.description || 'No description available').replace(/"/g, '&quot;')}"
                                  style="cursor: pointer;">
                                ${a.name}
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : p.abilities ? `
                <div class="info-card">
                    <h2>⚡ Abilities</h2>
                    <div class="abilities-list">
                        ${p.abilities.split(',').map(a => `<span class="ability-badge">${a.trim()}</span>`).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="info-card">
                <h2>📊 Base Stats</h2>
                <div class="stats-grid">
                    ${renderStatRow('HP', p.hp || 0, 255, color)}
                    ${renderStatRow('Attack', p.attack || 0, 190, color)}
                    ${renderStatRow('Defense', p.defense || 0, 230, color)}
                    ${renderStatRow('Sp. Atk', p.sp_atk || 0, 194, color)}
                    ${renderStatRow('Sp. Def', p.sp_def || 0, 230, color)}
                    ${renderStatRow('Speed', p.speed || 0, 200, color)}
                    ${renderStatRow('BST', p.bst || 0, 780, '#888', true)}
                </div>
            </div>

            ${p.description ? `
                <div class="info-card full-width">
                    <h2>📖 Description</h2>
                    <p style="line-height: 1.6; color: #555;">${p.description}</p>
                </div>
            ` : ''}

            ${renderEvolutionChain(p.evolution_chain, p.id, color)}
        </div>
    `;

    setTimeout(() => {
        document.querySelectorAll('.stat-fill').forEach(bar => {
            bar.style.width = bar.getAttribute('data-width');
        });
        initAbilityTooltips();
    }, 100);
}

function renderTypeEffectiveness(effectiveness) {
    if (!effectiveness || !effectiveness.defensive || !effectiveness.defensive.multipliers) {
        return '';
    }

    const multipliers = effectiveness.defensive.multipliers;

    const grouped = {
        immune: [],      // 0x
        veryResistant: [], // 0.25x
        resistant: [],   // 0.5x
        weak: [],        // 2x
        veryWeak: []     // 4x
    };

    Object.entries(multipliers).forEach(([type, multiplier]) => {
        if (multiplier === 0) {
            grouped.immune.push(type);
        } else if (multiplier === 0.25) {
            grouped.veryResistant.push(type);
        } else if (multiplier === 0.5) {
            grouped.resistant.push(type);
        } else if (multiplier === 2) {
            grouped.weak.push(type);
        } else if (multiplier === 4) {
            grouped.veryWeak.push(type);
        }
    });

    const hasAnyEffectiveness = Object.values(grouped).some(arr => arr.length > 0);

    if (!hasAnyEffectiveness) return '';

    return `
        <div class="info-card full-width">
            <h2>⚔️ Type Effectiveness (Defensive)</h2>
            <div class="type-effectiveness-grid">
                ${renderEffectivenessCategory('Immune to (0×)', grouped.immune, 'immune', '✨')}
                ${renderEffectivenessCategory('Very Resistant to (¼×)', grouped.veryResistant, 'very-resistant', '💪💪')}
                ${renderEffectivenessCategory('Resistant to (½×)', grouped.resistant, 'resistant', '💪')}
                ${renderEffectivenessCategory('Weak to (2×)', grouped.weak, 'weak', '💔')}
                ${renderEffectivenessCategory('Very Weak to (4×)', grouped.veryWeak, 'very-weak', '💔💔')}
            </div>
        </div>
    `;
}

function renderEffectivenessCategory(title, types, category, emoji) {
    if (types.length === 0) return '';

    return `
        <div class="effectiveness-category ${category}">
            <h3>${emoji} ${title}</h3>
            <div class="type-badges-container">
                ${types.map(type => `
                    <a href="type.html?name=${type}" 
                       class="type-badge type-${type}"
                       style="cursor: pointer; text-decoration: none;">
                        ${type}
                    </a>
                `).join('')}
            </div>
        </div>
    `;
}

function initAbilityTooltips() {
    const abilities = document.querySelectorAll('.clickable-ability');
    abilities.forEach(ability => {
        const description = ability.getAttribute('data-description');
        
        ability.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'ability-tooltip';
            tooltip.textContent = description;
            tooltip.id = 'active-tooltip';
            document.body.appendChild(tooltip);
            
            const rect = ability.getBoundingClientRect();
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + window.scrollY + 'px';
            
            setTimeout(() => tooltip.classList.add('show'), 10);
        });
        
        ability.addEventListener('mouseleave', () => {
            const tooltip = document.getElementById('active-tooltip');
            if (tooltip) {
                tooltip.classList.remove('show');
                setTimeout(() => tooltip.remove(), 200);
            }
        });
    });
}

function renderStatRow(label, val, max, color, isBold = false) {
    const pct = Math.min(((val || 0) / max) * 100, 100);
    return `
        <div class="stat-row" ${isBold ? 'style="border-top: 2px solid #ddd; padding-top: 10px; margin-top: 5px;"' : ''}>
            <span style="${isBold ? 'font-weight: bold;' : ''}">${label}</span>
            <strong style="${isBold ? 'font-size: 1.1em;' : ''}">${val || 0}</strong>
            <div class="stat-bar">
                <div class="stat-fill" style="background:${color}" data-width="${pct}%"></div>
            </div>
        </div>
    `;
}

function renderEvolutionChain(chain, currentId, mainColor) {
    if (!chain || !chain.id) {
        return `
            <div class="info-card full-width">
                <h2>🔄 Evolution Chain</h2>
                <p style="text-align: center; color: #777; padding: 20px;">No evolution data available</p>
            </div>
        `;
    }

    const linearChain = flattenEvolutionChain(chain);
    const hasBranches = checkForBranches(chain);

    return `
        <div class="info-card full-width">
            <h2>🔄 Evolution Chain</h2>
            <div class="evolution-tree">
                ${hasBranches ? renderBranchedEvolution(chain, currentId, mainColor) : renderLinearEvolution(linearChain, currentId, mainColor)}
            </div>
        </div>
    `;
}

function flattenEvolutionChain(node, result = []) {
    if (!node) return result;
    result.push(node);
    if (node.evolutions && node.evolutions.length > 0) {
        flattenEvolutionChain(node.evolutions[0], result);
    }
    return result;
}

function checkForBranches(node) {
    if (!node) return false;
    if (node.evolutions && node.evolutions.length > 1) return true;
    if (node.evolutions && node.evolutions.length === 1) {
        return checkForBranches(node.evolutions[0]);
    }
    return false;
}

function renderLinearEvolution(chain, currentId, mainColor) {
    let html = '<div class="evo-linear">';
    chain.forEach((pokemon, index) => {
        const isCurrent = pokemon.id === currentId;
        const apiImg = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
        const localImg = `./images/${pokemon.id}.png`;
        
        html += `
            <div class="evo-node ${isCurrent ? 'current' : 'clickable'}"
                 ${!isCurrent ? `onclick="window.location.href='details.html?id=${pokemon.id}'"` : ''}
                 style="${isCurrent ? `
                    border: 3px solid ${mainColor};
                    box-shadow: 0 0 20px ${mainColor}66;
                    background: linear-gradient(135deg, ${mainColor}11, transparent);
                 ` : ''}">
                <img src="${apiImg}" width="96" onerror="this.onerror=null; this.src='${localImg}';">
                <div class="evo-name" style="text-transform: capitalize; font-weight: ${isCurrent ? 'bold' : 'normal'};">
                    ${pokemon.name}
                </div>
                ${isCurrent ? '<small style="color: #888; font-weight: 500;">Current</small>' : ''}
            </div>
        `;
        
        if (index < chain.length - 1) {
            const nextPokemon = chain[index + 1];
            const requirement = nextPokemon.requirement || pokemon.evolutions?.[0]?.requirement || 'Level Up';
            html += `
                <div class="evo-arrow">
                    <div class="requirement">${requirement}</div>
                    <div class="arrow">→</div>
                </div>
            `;
        }
    });
    html += '</div>';
    return html;
}

function renderBranchedEvolution(node, currentId, mainColor) {
    const isCurrent = node.id === currentId;
    const apiImg = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${node.id}.png`;
    const localImg = `./images/${node.id}.png`;
    
    let html = '<div class="evo-stage">';
    html += `
        <div class="evo-node ${isCurrent ? 'current' : 'clickable'}"
             ${!isCurrent ? `onclick="window.location.href='details.html?id=${node.id}'"` : ''}
             style="${isCurrent ? `
                border: 3px solid ${mainColor};
                box-shadow: 0 0 20px ${mainColor}66;
                background: linear-gradient(135deg, ${mainColor}11, transparent);
             ` : ''}">
            <img src="${apiImg}" width="96" onerror="this.onerror=null; this.src='${localImg}';">
            <div class="evo-name" style="text-transform: capitalize; font-weight: ${isCurrent ? 'bold' : 'normal'};">
                ${node.name}
            </div>
            ${isCurrent ? '<small style="color: #888; font-weight: 500;">Current</small>' : ''}
        </div>
    `;
    
    if (node.evolutions && node.evolutions.length > 1) {
        html += `<div class="evo-arrow-main"><div class="arrow">→</div></div><div class="evo-branches">`;
        for (const evo of node.evolutions) {
            html += `
                <div class="evo-branch">
                    <div class="evo-arrow-branch">
                        <div class="requirement">${evo.requirement || 'Unknown'}</div>
                        <div class="arrow-line">→</div>
                    </div>
                    ${renderEvolutionNodeSimple(evo, currentId, mainColor)}
                </div>`;
        }
        html += '</div>';
    } else if (node.evolutions && node.evolutions.length === 1) {
        const evo = node.evolutions[0];
        html += `
            <div class="evo-arrow">
                <div class="requirement">${evo.requirement || 'Level Up'}</div>
                <div class="arrow">→</div>
            </div>
            ${renderBranchedEvolution(evo, currentId, mainColor)}
        `;
    }
    
    html += '</div>';
    return html;
}

function renderEvolutionNodeSimple(node, currentId, mainColor) {
    if (!node) return '';
    const isCurrent = node.id === currentId;
    const apiImg = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${node.id}.png`;
    const localImg = `./images/${node.id}.png`;
    
    return `
        <div class="evo-node ${isCurrent ? 'current' : 'clickable'}"
             ${!isCurrent ? `onclick="window.location.href='details.html?id=${node.id}'"` : ''}
             style="${isCurrent ? `
                border: 3px solid ${mainColor};
                box-shadow: 0 0 20px ${mainColor}66;
                background: linear-gradient(135deg, ${mainColor}11, transparent);
             ` : ''}">
            <img src="${apiImg}" width="96" onerror="this.onerror=null; this.src='${localImg}';">
            <div class="evo-name" style="text-transform: capitalize; font-weight: ${isCurrent ? 'bold' : 'normal'};">
                ${node.name}
            </div>
            ${isCurrent ? '<small style="color: #888; font-weight: 500;">Current</small>' : ''}
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', loadPokemon);