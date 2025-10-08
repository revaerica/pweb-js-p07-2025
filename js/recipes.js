document.addEventListener('DOMContentLoaded', () => {
    const RECIPES_API_URL = 'https://dummyjson.com/recipes';
    const RECIPES_PER_LOAD = 10; // Jumlah resep per muatan

    let allRecipes = [];
    let displayedRecipes = [];
    let currentLimit = RECIPES_PER_LOAD;
    let currentSearchTerm = '';
    let currentCuisineFilter = '';
    let isFetching = false;

    // Elemen DOM
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutButton = document.getElementById('logout-button');
    const recipeList = document.getElementById('recipe-list');
    const searchInput = document.getElementById('search-input');
    const cuisineFilter = document.getElementById('cuisine-filter');
    const showMoreButton = document.getElementById('show-more-button');
    const showingRecipesSpan = document.getElementById('showing-recipes');
    const loadingRecipesDiv = document.getElementById('loading-recipes');
    const recipeModal = document.getElementById('recipe-modal');
    const closeModalButton = document.getElementById('close-modal');
    const modalBody = document.getElementById('modal-body');

    // Cek status login
    const userFirstName = localStorage.getItem('userFirstName');
    if (!userFirstName) {
        // Redirect ke login jika belum login
        window.location.href = 'index.html';
        return;
    }

    // Inisialisasi: Tampilkan nama user
    welcomeMessage.textContent = `Welcome, ${userFirstName}!`;

    /**
     * Helper untuk menampilkan bintang rating.
     * @param {number} rating - Nilai rating (0-5).
     * @returns {string} HTML untuk bintang.
     */
    
    function renderRatingStars(rating) {
  const percentage = (rating / 5) * 100;

  return `
    <span class="stars">
      <span class="stars-outer">★★★★★</span>
      <span class="stars-inner" style="width:${percentage}%;">★★★★★</span>
    </span>
  `;
}

    /**
     * Render satu card resep.
     * @param {Object} recipe - Objek resep dari API.
     * @returns {string} HTML untuk card resep.
     */
    function renderRecipeCard(recipe) {
        // Ambil 3 ingredients pertama dan tambahkan "+ more" jika ada lebih dari 3
        const ingredientsSnippet = recipe.ingredients.slice(0, 3).join(', ');
        const moreCount = recipe.ingredients.length - 3;
        const moreText = moreCount > 0 ? ` +${moreCount} more` : '';

        return `
            <div class="recipe-card">
                <div class="recipe-image-wrapper">
                    <img src="${recipe.image}" alt="${recipe.name}" class="recipe-image" loading="lazy">
                </div>
                <div class="recipe-content">
                    <div>
                        <h3 class="recipe-title">${recipe.name}</h3>
                        <div class="recipe-meta">
                            <span><i class="fas fa-clock"></i> ${recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins</span>
                            <span><i class="fas fa-level-up-alt"></i> ${recipe.difficulty}</span>
                            <span><i class="fas fa-utensils"></i> ${recipe.cuisine}</span>
                        </div>
                        <p class="recipe-ingredients">
                            <strong>Ingredients:</strong> ${ingredientsSnippet}${moreText}
                        </p>
                        <div class="recipe-rating">
                            ${renderRatingStars(recipe.rating)}
                            <span class="rating-text">(${recipe.rating.toFixed(1)})</span>
                        </div>
                    </div>
                    <button class="btn btn-primary" data-id="${recipe.id}" onclick="showRecipeDetail(${recipe.id})">VIEW FULL RECIPE</button>
                </div>
            </div>
        `;
    }

    /**
     * Render daftar resep ke DOM berdasarkan batas saat ini.
     */
    function renderRecipes() {
        const startIndex = 0;
        const endIndex = currentLimit;

        // Filter resep berdasarkan search term dan cuisine
        const filtered = allRecipes.filter(recipe => {
            // 1. Filter Cuisine
            const isCuisineMatch = !currentCuisineFilter || recipe.cuisine === currentCuisineFilter;
            
            // 2. Filter Search Term (Case-insensitive match on name, cuisine, ingredients, tags)
            const lowerCaseSearch = currentSearchTerm.toLowerCase();
            const isSearchMatch = !currentSearchTerm ||
                recipe.name.toLowerCase().includes(lowerCaseSearch) ||
                recipe.cuisine.toLowerCase().includes(lowerCaseSearch) ||
                recipe.ingredients.some(ing => ing.toLowerCase().includes(lowerCaseSearch)) ||
                recipe.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearch));

            return isCuisineMatch && isSearchMatch;
        });

        displayedRecipes = filtered;

        // Tampilkan pesan jika tidak ada hasil
        if (displayedRecipes.length === 0) {
            recipeList.innerHTML = '<p class="no-results">No recipes found matching your criteria. Try adjusting the search or filter.</p>';
            showMoreButton.classList.add('hidden');
            showingRecipesSpan.textContent = 'Showing 0 of 0 recipes.';
            return;
        }

        // Render cards
        const recipesToShow = displayedRecipes.slice(startIndex, endIndex);
        recipeList.innerHTML = recipesToShow.map(renderRecipeCard).join('');

        // Update Show More button state
        if (currentLimit < displayedRecipes.length) {
            showMoreButton.classList.remove('hidden');
        } else {
            showMoreButton.classList.add('hidden');
        }

        // Update counter
        const showingCount = Math.min(currentLimit, displayedRecipes.length);
        showingRecipesSpan.textContent = `Showing ${showingCount} of ${displayedRecipes.length} recipes.`;
    }
    
    /**
     * Mengisi dropdown filter Cuisine dengan opsi unik.
     */
    function populateCuisineFilter() {
        const cuisines = new Set(allRecipes.map(r => r.cuisine));
        let optionsHtml = '<option value="">All Cuisines</option>';
        
        // Urutkan cuisine secara alfabetis
        Array.from(cuisines).sort().forEach(cuisine => {
            optionsHtml += `<option value="${cuisine}">${cuisine}</option>`;
        });

        cuisineFilter.innerHTML = optionsHtml;
    }

    /**
     * Mengambil data resep dari API.
     */
    async function fetchRecipes() {
        if (isFetching) return;
        isFetching = true;
        loadingRecipesDiv.classList.remove('hidden');
        recipeList.innerHTML = ''; // Clear previous content

        try {
            const response = await fetch(RECIPES_API_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            allRecipes = data.recipes || [];

            // Isi filter dan render tampilan awal
            populateCuisineFilter();
            renderRecipes();
        } catch (error) {
            console.error('Failed to fetch recipes:', error);
            recipeList.innerHTML = '<p class="no-results" style="color:#ef4444;">Failed to load recipes. Please check API connection.</p>';
        } finally {
            loadingRecipesDiv.classList.add('hidden');
            isFetching = false;
        }
    }

    /**
     * Handler untuk tombol Show More (Lazy Pagination).
     */
    function handleShowMore() {
        // Tingkatkan batas tampilan
        currentLimit += RECIPES_PER_LOAD;
        
        // Render ulang daftar resep
        renderRecipes();

        // Scroll ke resep baru (opsional: agar user tau ada konten baru)
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }

    /**
     * Menangani logika filter dan search.
     * Reset limit ke awal setiap kali filter/search berubah.
     */
    function handleFilterAndSearch() {
        currentLimit = RECIPES_PER_LOAD; // Reset limit
        renderRecipes();
    }
    
    // --- Debouncing Search Input ---
    let debounceTimeout = null;
    searchInput.addEventListener('input', () => {
        // Hapus timeout sebelumnya
        clearTimeout(debounceTimeout);
        
        // Set timeout baru
        debounceTimeout = setTimeout(() => {
            currentSearchTerm = searchInput.value.trim();
            handleFilterAndSearch();
        }, 300); // Debounce 300ms
    });

    // Event Listener untuk Filter Cuisine
    cuisineFilter.addEventListener('change', (e) => {
        currentCuisineFilter = e.target.value;
        handleFilterAndSearch();
    });

    // Event Listener untuk Show More
    showMoreButton.addEventListener('click', handleShowMore);

    // Event Listener untuk Logout
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('userFirstName');
        window.location.href = 'index.html';
    });

    // --- Modal Logic ---

    // Mengambil dan menampilkan detail resep di modal
    window.showRecipeDetail = async function(recipeId) {
        // Hapus konten sebelumnya dan tampilkan spinner
        modalBody.innerHTML = `
            <div class="modal-spinner-wrapper"><div class="spinner"></div></div>
        `;
        recipeModal.classList.remove('hidden');

        try {
            // Ambil detail resep tunggal
            const response = await fetch(`${RECIPES_API_URL}/${recipeId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch recipe detail');
            }
            const recipe = await response.json();

            // Render detail resep
            const detailHtml = `
                <h2>${recipe.name}</h2>
                <img src="${recipe.image}" alt="${recipe.name}" class="modal-header-image">
                
                <div class="modal-stats-grid">
                    <div class="modal-stat-item">
                        <strong>PREP TIME</strong>
                        <span>${recipe.prepTimeMinutes} mins</span>
                    </div>
                    <div class="modal-stat-item">
                        <strong>COOK TIME</strong>
                        <span>${recipe.cookTimeMinutes} mins</span>
                    </div>
                    <div class="modal-stat-item">
                        <strong>SERVINGS</strong>
                        <span>${recipe.servings}</span>
                    </div>
                    <div class="modal-stat-item">
                        <strong>DIFFICULTY</strong>
                        <span class="difficulty">${recipe.difficulty}</span>
                    </div>
                    <div class="modal-stat-item">
                        <strong>CUISINE</strong>
                        <span class="cuisine">${recipe.cuisine}</span>
                    </div>
                    <div class="modal-stat-item">
                        <strong>CALORIES</strong>
                        <span>${recipe.caloriesPerServing} cal/serving</span>
                    </div>
                </div>

                <div class="modal-rating-section">
                    ${renderRatingStars(recipe.rating)}
                    <span class="rating-text">(${recipe.rating.toFixed(1)}) ${recipe.reviewCount} reviews</span>
                </div>

                <div class="modal-tags">
                    ${recipe.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>

                <h3>Ingredients</h3>
                <ul>
                    ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>

                <h3>Instructions</h3>
                <ol>
                    ${recipe.instructions.map(inst => `<li>${inst}</li>`).join('')}
                </ol>
            `;
            
            modalBody.innerHTML = detailHtml;

        } catch (error) {
            console.error('Error fetching recipe detail:', error);
            modalBody.innerHTML = '<p class="no-results" style="color:#ef4444;">Failed to load recipe details.</p>';
        }
    };

    // Event Listener untuk menutup modal
    closeModalButton.addEventListener('click', () => {
        recipeModal.classList.add('hidden');
    });

    // Tutup modal jika user klik di luar modal
    window.addEventListener('click', (event) => {
        if (event.target === recipeModal) {
            recipeModal.classList.add('hidden');
        }
    });


    // Mulai pengambilan data resep
    fetchRecipes();
});
