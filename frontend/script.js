let pokemonData = []

const typeColors = {
    grass: "#78C850",
    fire: "#F08030",
    water: "#6890F0",
    bug: "#A8B820",
    normal: "#A8A878",
    poison: "#A040A0",
    electric: "#F8D030",
    ground: "#E0C068",
    fairy: "#EE99AC",
    fighting: "#C03028",
    psychic: "#F85888",
    rock: "#B8A038",
    ghost: "#705898",
    ice: "#98D8D8",
    dragon: "#7038F8",
    flying: "#A890F0",
    steel: "#B8B8D0",
    dark: "#705848"
}

async function loadPokedex() {
    try {
        const res = await fetch("http://127.0.0.1:5000/api/pokemon")
        const data = await res.json()

        // Map generation to region
        const generationToRegion = {
            1: "kanto",
            2: "johto",
            3: "hoenn",
            4: "sinnoh",
            5: "unova",
            6: "kalos",
            7: "alola",
            8: "galar"
        }

        pokemonData = data.map(p => ({
            id: p.id,
            name: p.name,
            type1: p.type1.toLowerCase(),
            type2: p.type2 ? p.type2.toLowerCase() : "",
            hp: p.hp,
            attack: p.attack,
            defense: p.defense,
            sp_atk: p.sp_atk,
            sp_def: p.sp_def,
            speed: p.speed,
            bst: p.bst,
            legendary: p.legendary,
            region: generationToRegion[p.generation] || "",
            generation: p.generation,
            description: p.description,
            height: p.height,
            weight: p.weight,
            bmi: p.bmi,
            catch_rate: p.catch_rate,
            final_evolution: p.final_evolution,
            abilities: p.abilities || "",
            evo_data_json: p.evo_data_json || []
        }))

        console.log("Total Pokemon loaded:", pokemonData.length)

        document.getElementById("loading-spinner").style.display = "none"
        searchPokemon()
    } catch (error) {
        console.error("Error loading Pokédex:", error)
        document.getElementById("loading-spinner").innerHTML = `
            <div style="text-align: center; color: #e74c3c; font-weight: bold;">
                ⚠️ Failed to load Pokémon data. Please make sure the backend server is running.
            </div>
        `
    }
}

function searchPokemon() {
    const idName = document.getElementById("id-name-search").value.toLowerCase().trim()
    const start = document.getElementById("start").value.toLowerCase()
    const include = document.getElementById("include").value.toLowerCase()
    const exclude = document.getElementById("exclude").value.toLowerCase()
    const length = parseInt(document.getElementById("length").value)
    const position = document.getElementById("position").value.toLowerCase()
    const type = document.getElementById("type-filter").value.toLowerCase().trim()
    const region = document.getElementById("region-filter").value.toLowerCase().trim()
    const legendary = document.getElementById("legendary-filter").value
    const sort = document.getElementById("sort-stat").value
    
    // New filters
    const generation = document.getElementById("generation-filter").value
    const evolutionStage = document.getElementById("evolution-filter").value
    const dualTypeOnly = document.getElementById("dual-type-filter").checked
    const minBST = parseInt(document.getElementById("min-bst").value) || 0
    const maxBST = parseInt(document.getElementById("max-bst").value) || 9999
    const catchDifficulty = document.getElementById("catch-difficulty").value
    const ability = document.getElementById("ability-search").value.toLowerCase().trim()
    const minHeight = parseFloat(document.getElementById("min-height").value) || 0
    const maxHeight = parseFloat(document.getElementById("max-height").value) || 9999
    const minWeight = parseFloat(document.getElementById("min-weight").value) || 0
    const maxWeight = parseFloat(document.getElementById("max-weight").value) || 9999

    let list = pokemonData.filter(p => {
        const n = p.name.toLowerCase()

        // Original filters
        if (idName && !n.includes(idName) && String(p.id) !== idName) return false
        if (start && !n.startsWith(start)) return false
        if (include && ![...include].every(c => n.includes(c))) return false
        if (exclude.split(",").some(c => c && n.includes(c.trim()))) return false
        if (length && n.length !== length) return false
        if (position && [...position].some((c, i) => c !== "_" && n[i] !== c)) return false
        if (type && p.type1 !== type && p.type2 !== type) return false
        if (region && p.region !== region) return false
        if (legendary !== "" && String(p.legendary) !== legendary) return false
        
        // New filters
        if (generation && String(p.generation) !== generation) return false
        if (evolutionStage === "basic" && p.evo_data_json.length > 0) return false
        if (evolutionStage === "final" && p.final_evolution !== 1) return false
        if (evolutionStage === "evolves" && p.evo_data_json.length === 0 && p.final_evolution !== 1) return false
        if (dualTypeOnly && !p.type2) return false
        if (p.bst < minBST || p.bst > maxBST) return false
        if (catchDifficulty === "easy" && p.catch_rate < 100) return false
        if (catchDifficulty === "medium" && (p.catch_rate < 50 || p.catch_rate >= 100)) return false
        if (catchDifficulty === "hard" && p.catch_rate >= 50) return false
        if (ability && !p.abilities.toLowerCase().includes(ability)) return false
        if (p.height < minHeight || p.height > maxHeight) return false
        if (p.weight < minWeight || p.weight > maxWeight) return false

        return true
    })

    list.sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name)
        if (sort === "id") return a.id - b.id
        if (sort === "height") return b.height - a.height
        if (sort === "weight") return b.weight - a.weight
        if (sort === "catch_rate") return b.catch_rate - a.catch_rate
        return b[sort] - a[sort]
    })

    const countText = document.getElementById("count-text")
    countText.innerText = `Found ${list.length} Pokémon${list.length === 1 ? '' : 's'}`
    countText.style.display = list.length > 0 ? 'block' : 'none'
    
    renderResults(list)
}

function renderResults(list) {
    const results = document.getElementById("results")
    
    if (list.length === 0) {
        results.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #7f8c8d;">
                <div style="font-size: 4rem; margin-bottom: 20px;">😔</div>
                <h2 style="font-size: 1.5rem; margin-bottom: 10px; color: #2c3e50;">No Pokémon Found</h2>
                <p style="font-size: 1rem;">Try adjusting your search filters</p>
            </div>
        `
        return
    }
    
    results.innerHTML = list.map(p => {
        const color = typeColors[p.type1]
        const img = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`
        const idFormatted = String(p.id).padStart(3, '0')
        
        return `
        <li class="pokemon-card" style="border-bottom-color:${color}" onclick="openModal(${p.id})">
            <img src="${img}" alt="${p.name}" loading="lazy">
            <div style="flex: 1;">
                <div style="font-size: 0.75rem; color: #95a5a6; font-weight: 700; margin-bottom: 4px;">#${idFormatted}</div>
                <strong style="text-transform:capitalize; display: block; margin-bottom: 8px;">${p.name}</strong>
                <div>
                    <a href="type.html?name=${p.type1}" class="type-badge" style="background:${typeColors[p.type1]}; text-decoration: none; color: white;" onclick="event.stopPropagation()">${p.type1}</a>
                    ${p.type2 ? `<a href="type.html?name=${p.type2}" class="type-badge" style="background:${typeColors[p.type2]}; text-decoration: none; color: white;" onclick="event.stopPropagation()">${p.type2}</a>` : ''}
                </div>
            </div>
        </li>`
    }).join("")
}

async function openModal(id) {
    const modal = document.getElementById("pokeModal")
    const modalBody = document.getElementById("modal-body")
    
    modal.style.display = "flex"
    modalBody.innerHTML = '<div class="spinner"></div>'
    
    try {
        const res = await fetch(`http://127.0.0.1:5000/api/pokemon/${id}`)
        const p = await res.json()
        
        // Map generation to region
        const generationToRegion = {
            1: "Kanto", 2: "Johto", 3: "Hoenn", 4: "Sinnoh",
            5: "Unova", 6: "Kalos", 7: "Alola", 8: "Galar"
        }
        const region = generationToRegion[p.generation] || "Unknown"
        
        const img = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`
        const idFormatted = String(p.id).padStart(3, '0')
        
        modalBody.innerHTML = `
            <div style="position: relative;">
                <button onclick="closeModal()" style="position: absolute; top: -10px; right: -10px; width: 36px; height: 36px; border-radius: 50%; border: none; background: #e74c3c; color: white; font-size: 1.2rem; cursor: pointer; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">×</button>
                
                <div style="font-size: 0.9rem; color: #95a5a6; font-weight: 700; margin-bottom: 4px;">#${idFormatted}</div>
                <h2 style="font-size: 1.6rem; font-weight: 900; color: #2c3e50; text-transform: capitalize; margin-bottom: 12px;">${p.name}</h2>
                
                <img src="${img}" alt="${p.name}" style="width: 140px; height: 140px; object-fit: contain; margin: 10px auto; display: block;">
                
                <div style="display: flex; justify-content: center; gap: 8px; margin: 12px 0;">
                    <a href="type.html?name=${p.type1.toLowerCase()}" class="type-badge" style="background:${typeColors[p.type1.toLowerCase()]}; font-size: 0.7rem; padding: 5px 12px; text-decoration: none; color: white; cursor: pointer;">${p.type1}</a>
                    ${p.type2 ? `<a href="type.html?name=${p.type2.toLowerCase()}" class="type-badge" style="background:${typeColors[p.type2.toLowerCase()]}; font-size: 0.7rem; padding: 5px 12px; text-decoration: none; color: white; cursor: pointer;">${p.type2}</a>` : ''}
                </div>
                
                ${p.description ? `<p style="font-size: 0.85rem; line-height: 1.5; color: #34495e; margin: 14px 0; padding: 12px; background: #f8f9fa; border-radius: 10px; text-align: left;">${p.description}</p>` : ''}
                
                <div class="stats-box">
                    ${createStatBar('HP', p.hp, 255)}
                    ${createStatBar('ATK', p.attack, 190)}
                    ${createStatBar('DEF', p.defense, 230)}
                    ${createStatBar('SpA', p.sp_atk, 194)}
                    ${createStatBar('SpD', p.sp_def, 230)}
                    ${createStatBar('SPD', p.speed, 180)}
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 16px;">
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 10px;">
                        <div style="font-size: 0.65rem; color: #7f8c8d; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Region</div>
                        <div style="font-size: 0.95rem; font-weight: 800; color: #2c3e50; text-transform: capitalize;">${region}</div>
                    </div>
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 10px;">
                        <div style="font-size: 0.65rem; color: #7f8c8d; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">Total BST</div>
                        <div style="font-size: 0.95rem; font-weight: 800; color: #2c3e50;">${p.bst}</div>
                    </div>
                </div>
                
                ${p.legendary ? '<div style="margin-top: 10px; padding: 10px; background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); border-radius: 10px; font-weight: 800; color: #f39c12; font-size: 0.9rem;">⭐ Legendary Pokémon</div>' : ''}
                
                <a href="details.html?id=${p.id}" style="display: block; margin-top: 16px; padding: 12px; background: linear-gradient(135deg, var(--primary-red) 0%, #ff8a80 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 0.9rem; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(239, 83, 80, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(239, 83, 80, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(239, 83, 80, 0.3)'">📄 View Full Details</a>
            </div>
        `
    } catch (error) {
        console.error('Error loading Pokémon:', error)
        modalBody.innerHTML = '<p style="color: #e74c3c; padding: 20px;">Failed to load Pokémon data.</p>'
    }
}

function createStatBar(label, value, max) {
    const percentage = (value / max) * 100
    return `
        <div class="stat-row">
            <span class="stat-label">${label}</span>
            <span class="stat-value">${value}</span>
            <div class="stat-bar-container">
                <div class="stat-bar-fill" style="width: ${percentage}%"></div>
            </div>
        </div>
    `
}

function closeModal() {
    document.getElementById("pokeModal").style.display = "none"
}

function clearFilters() {
    document.querySelectorAll("input, select").forEach(e => e.value = "")
    searchPokemon()
    
    // Visual feedback
    const btn = document.querySelector('.clear-btn')
    btn.style.transform = 'scale(0.95)'
    setTimeout(() => {
        btn.style.transform = ''
    }, 150)
}

// Initialize on page load
loadPokedex()

// Toggle name advanced filters
function toggleNameAdvancedFilters() {
    const nameAdvanced = document.getElementById('name-advanced-filters')
    const nameToggleText = document.getElementById('name-toggle-text')
    
    if (nameAdvanced.style.display === 'none') {
        nameAdvanced.style.display = 'block'
        nameToggleText.textContent = '▲ Hide Advanced Name Filters'
    } else {
        nameAdvanced.style.display = 'none'
        nameToggleText.textContent = '▼ Advanced Name Filters'
    }
}

// Toggle advanced filters
function toggleAdvancedFilters() {
    const advanced = document.getElementById('advanced-filters')
    const toggleText = document.getElementById('toggle-text')
    
    if (advanced.style.display === 'none') {
        advanced.style.display = 'block'
        toggleText.textContent = '▲ Hide Advanced Filters'
    } else {
        advanced.style.display = 'none'
        toggleText.textContent = '▼ Show Advanced Filters'
    }
}

// Add keyboard shortcut for clearing filters (Ctrl/Cmd + K)
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        clearFilters()
    }
})

// Toggle hamburger menu
function toggleMenu() {
    const navMenu = document.getElementById('navMenu')
    const navToggle = document.getElementById('navToggle')
    
    navMenu.classList.toggle('active')
    navToggle.classList.toggle('active')
}

// Close menu when clicking outside (mobile)
document.addEventListener('click', (e) => {
    const navMenu = document.getElementById('navMenu')
    const navToggle = document.getElementById('navToggle')
    
    if (navMenu && navToggle && window.innerWidth <= 768) {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navMenu.classList.remove('active')
            navToggle.classList.remove('active')
        }
    }
})

// Close menu when clicking on a link (mobile)
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            const navMenu = document.getElementById('navMenu')
            const navToggle = document.getElementById('navToggle')
            if (navMenu && navToggle) {
                navMenu.classList.remove('active')
                navToggle.classList.remove('active')
            }
        }
    })
})