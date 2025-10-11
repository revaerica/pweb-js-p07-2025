document.addEventListener("DOMContentLoaded", () => {
  const RECIPES_API_URL = "https://dummyjson.com/recipes";
  const RECIPES_PER_LOAD = 6;

  let allRecipes = [];
  let displayedRecipes = [];
  let currentLimit = RECIPES_PER_LOAD;
  let currentSearchTerm = "";
  let currentCuisineFilter = "";
  let isFetching = false;

  // Elemen DOM
  const welcomeMessage = document.getElementById("welcome-message");
  const logoutButton = document.getElementById("logout-button");
  const recipeModal = document.getElementById("recipe-modal");
  const closeModalButton = document.getElementById("close-modal");
  const modalBody = document.getElementById("modal-body");
  const recipeList = document.getElementById("recipe-list");
  const searchInput = document.getElementById("search-input");
  const cuisineFilter = document.getElementById("cuisine-filter");
  const showMoreButton = document.getElementById("show-more-button");
  const showingRecipesSpan = document.getElementById("showing-recipes");
  const loadingRecipesDiv = document.getElementById("loading-recipes");
  const favoritesCarousel = document.getElementById("favorites-carousel");
  const feedbackForm = document.getElementById("feedback-form");
  const navLinks = document.querySelectorAll(".nav-link");
  const pageSections = document.querySelectorAll(".page-section");
  const discoverBtn = document.querySelector(".discover-btn");

  // Cek status login
  const userFirstName = localStorage.getItem("userFirstName");
  if (!userFirstName) {
    window.location.href = "index.html";
    return;
  }
  welcomeMessage.textContent = `Welcome, ${userFirstName}!`;

  //==============================================//
  // BAGIAN 4: LOGIKA NAVIGASI SPA (DIPERBAIKI)
  //==============================================//
  function showPage(targetId) {
    // Langkah 1: Sembunyikan SEMUA section terlebih dahulu. Ini lebih aman.
    pageSections.forEach((section) => {
      section.classList.add("hidden");
    });

    // Langkah 2: Tampilkan section yang benar berdasarkan targetId.
    if (targetId === "#home") {
      // Jika targetnya home, tampilkan landing-page dan home-section
      document.getElementById("landing-page")?.classList.remove("hidden");
      document.getElementById("home-section")?.classList.remove("hidden");
    } else {
      // Untuk halaman lain, potong tanda '#' dari href untuk mendapatkan ID
      const pageId = targetId.slice(1);
      const targetSection = document.getElementById(pageId);
      // Tampilkan section yang dituju jika ada
      if (targetSection) {
        targetSection.classList.remove("hidden");
      }
    }

    // Langkah 3: Atur link navbar yang aktif
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === targetId);
    });

    window.scrollTo(0, 0);
    observeElements();
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      showPage(targetId);
    });
  });

  discoverBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const targetElement = document.querySelector(
      discoverBtn.getAttribute("href")
    );
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  });

  //==============================================//
  // BAGIAN 2: LOGIKA HALAMAN FAVORITES
  //==============================================//
  function renderFavorites() {
    if (allRecipes.length === 0 || !favoritesCarousel) return;

    const popularRecipes = [...allRecipes]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);

    // Kode ini sudah dirancang untuk memanggil modal saat diklik (onclick)
    // dan menggunakan class CSS dari Langkah 1
    favoritesCarousel.innerHTML = popularRecipes
      .map(
        (recipe) => `
        <a href="javascript:void(0)" class="favorite-card animate-on-scroll" onclick="showRecipeDetail(${
          recipe.id
        })">
            <img src="${recipe.image}" alt="${
          recipe.name
        }" class="favorite-card-image">
            <div class="favorite-card-content">
                <div>
                    <h3>${recipe.name}</h3>
                    <div class="recipe-rating">
                        ${renderRatingStars(recipe.rating)}
                        <span class="rating-text">(${recipe.rating.toFixed(
                          1
                        )})</span>
                    </div>
                </div>
            </div>
        </a>
    `
      )
      .join("");

    observeElements();
  }
  //==============================================//
  // BAGIAN 3: LOGIKA HALAMAN FEEDBACK
  //==============================================//
  if (feedbackForm) {
    feedbackForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("feedback-name").value.trim();
      const email = document.getElementById("feedback-email").value.trim();
      const message = document.getElementById("feedback-message").value.trim();
      if (!name || !email || !message) {
        alert("Please fill in all fields.");
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        alert("Please enter a valid email address.");
        return;
      }
      alert("Thank you for your feedback!");
      feedbackForm.reset();
    });
  }

  //==============================================//
  // KODE ASLI UNTUK HALAMAN RESEP (HOME)
  //==============================================//
  function renderRatingStars(rating) {
    const percentage = (rating / 5) * 100;
    return `
            <span class="stars">
                <span class="stars-outer">★★★★★</span>
                <span class="stars-inner" style="width:${percentage}%;">★★★★★</span>
            </span>
        `;
  }

  function renderRecipeCard(recipe) {
    const ingredientsSnippet = recipe.ingredients.slice(0, 3).join(", ");
    const moreCount = recipe.ingredients.length - 3;
    const moreText = moreCount > 0 ? ` +${moreCount} more` : "";
    return `
            <div class="recipe-card">
                <div class="recipe-image-wrapper">
                    <img src="${recipe.image}" alt="${
      recipe.name
    }" class="recipe-image" loading="lazy">
                </div>
                <div class="recipe-content">
                    <div>
                        <h3 class="recipe-title">${recipe.name}</h3>
                        <div class="recipe-meta">
                            <span><i class="fas fa-clock"></i> ${
                              recipe.prepTimeMinutes + recipe.cookTimeMinutes
                            } mins</span>
                            <span><i class="fas fa-level-up-alt"></i> ${
                              recipe.difficulty
                            }</span>
                            <span><i class="fas fa-utensils"></i> ${
                              recipe.cuisine
                            }</span>
                        </div>
                        <p class="recipe-ingredients">
                            <strong>Ingredients:</strong> ${ingredientsSnippet}${moreText}
                        </p>
                        <div class="recipe-rating">
                            ${renderRatingStars(recipe.rating)}
                            <span class="rating-text">(${recipe.rating.toFixed(
                              1
                            )})</span>
                        </div>
                    </div>
                    <button class="btn btn-primary" data-id="${
                      recipe.id
                    }" onclick="showRecipeDetail(${
      recipe.id
    })">VIEW FULL RECIPE</button>
                </div>
            </div>
        `;
  }

  function renderRecipes() {
    const filtered = allRecipes.filter((recipe) => {
      const isCuisineMatch =
        !currentCuisineFilter || recipe.cuisine === currentCuisineFilter;
      const lowerCaseSearch = currentSearchTerm.toLowerCase();
      const isSearchMatch =
        !currentSearchTerm ||
        recipe.name.toLowerCase().includes(lowerCaseSearch) ||
        recipe.cuisine.toLowerCase().includes(lowerCaseSearch) ||
        recipe.ingredients.some((ing) =>
          ing.toLowerCase().includes(lowerCaseSearch)
        ) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(lowerCaseSearch));
      return isCuisineMatch && isSearchMatch;
    });
    displayedRecipes = filtered;
    if (displayedRecipes.length === 0) {
      recipeList.innerHTML =
        '<p class="no-results">No recipes found matching your criteria.</p>';
      showMoreButton.classList.add("hidden");
      showingRecipesSpan.textContent = "Showing 0 of 0 recipes.";
      return;
    }
    const recipesToShow = displayedRecipes.slice(0, currentLimit);
    recipeList.innerHTML = recipesToShow
      .map((recipe) =>
        renderRecipeCard(recipe).replace(
          'class="recipe-card"',
          'class="recipe-card animate-on-scroll"'
        )
      )
      .join("");
    showMoreButton.classList.toggle(
      "hidden",
      currentLimit >= displayedRecipes.length
    );
    const showingCount = Math.min(currentLimit, displayedRecipes.length);
    showingRecipesSpan.textContent = `Showing ${showingCount} of ${displayedRecipes.length} recipes.`;
    observeElements();
  }

  function populateCuisineFilter() {
    const cuisines = [...new Set(allRecipes.map((r) => r.cuisine))].sort();
    cuisineFilter.innerHTML =
      '<option value="">All Cuisines</option>' +
      cuisines
        .map((cuisine) => `<option value="${cuisine}">${cuisine}</option>`)
        .join("");
  }

  async function fetchRecipes() {
    if (isFetching) return;
    isFetching = true;
    loadingRecipesDiv.classList.remove("hidden");
    recipeList.innerHTML = "";
    try {
      const response = await fetch(RECIPES_API_URL);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      allRecipes = data.recipes || [];
      populateCuisineFilter();
      renderRecipes();
      renderFavorites();
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
      recipeList.innerHTML =
        '<p class="no-results" style="color:#ef4444;">Failed to load recipes.</p>';
    } finally {
      loadingRecipesDiv.classList.add("hidden");
      isFetching = false;
    }
  }

  function handleShowMore() {
    currentLimit += RECIPES_PER_LOAD;
    renderRecipes();
  }

  function handleFilterAndSearch() {
    currentLimit = RECIPES_PER_LOAD;
    renderRecipes();
  }

  let debounceTimeout = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      currentSearchTerm = searchInput.value.trim();
      handleFilterAndSearch();
    }, 300);
  });

  cuisineFilter.addEventListener("change", (e) => {
    currentCuisineFilter = e.target.value;
    handleFilterAndSearch();
  });

  showMoreButton.addEventListener("click", handleShowMore);
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("userFirstName");
    window.location.href = "index.html";
  });

  // --- Modal Logic (Global) ---
  window.showRecipeDetail = async function (recipeId) {
    modalBody.innerHTML = `<div class="modal-spinner-wrapper"><div class="spinner"></div></div>`;
    recipeModal.classList.remove("hidden");
    try {
      const response = await fetch(`${RECIPES_API_URL}/${recipeId}`);
      if (!response.ok) throw new Error("Failed to fetch recipe detail");
      const recipe = await response.json();
      const detailHtml = `
                <h2>${recipe.name}</h2>
                <img src="${recipe.image}" alt="${
        recipe.name
      }" class="modal-header-image">
                <div class="modal-stats-grid">
                    <div class="modal-stat-item"><strong>PREP TIME</strong><span>${
                      recipe.prepTimeMinutes
                    } mins</span></div>
                    <div class="modal-stat-item"><strong>COOK TIME</strong><span>${
                      recipe.cookTimeMinutes
                    } mins</span></div>
                    <div class="modal-stat-item"><strong>SERVINGS</strong><span>${
                      recipe.servings
                    }</span></div>
                    <div class="modal-stat-item"><strong>DIFFICULTY</strong><span class="difficulty">${
                      recipe.difficulty
                    }</span></div>
                    <div class="modal-stat-item"><strong>CUISINE</strong><span class="cuisine">${
                      recipe.cuisine
                    }</span></div>
                    <div class="modal-stat-item"><strong>CALORIES</strong><span>${
                      recipe.caloriesPerServing
                    } cal/serving</span></div>
                </div>
                <div class="modal-rating-section">${renderRatingStars(
                  recipe.rating
                )}<span class="rating-text">(${recipe.rating.toFixed(1)}) ${
        recipe.reviewCount
      } reviews</span></div>
                <div class="modal-tags">${recipe.tags
                  .map((tag) => `<span class="tag">${tag}</span>`)
                  .join("")}</div>
                <h3>Ingredients</h3>
                <ul>${recipe.ingredients
                  .map((ing) => `<li>${ing}</li>`)
                  .join("")}</ul>
                <h3>Instructions</h3>
                <ol>${recipe.instructions
                  .map((inst) => `<li>${inst}</li>`)
                  .join("")}</ol>
            `;
      modalBody.innerHTML = detailHtml;
    } catch (error) {
      console.error("Error fetching recipe detail:", error);
      modalBody.innerHTML =
        '<p class="no-results" style="color:#ef4444;">Failed to load recipe details.</p>';
    }
  };

  closeModalButton.addEventListener("click", () =>
    recipeModal.classList.add("hidden")
  );
  window.addEventListener("click", (event) => {
    if (event.target === recipeModal) recipeModal.classList.add("hidden");
  });

  const menuToggle = document.getElementById("menu-toggle");
  const navLinksContainer = document.getElementById("nav-links");
  if (menuToggle && navLinksContainer) {
    menuToggle.addEventListener("click", () =>
      navLinksContainer.classList.toggle("active")
    );
  }

  //==============================================//
  // BAGIAN 5: LOGIKA ANIMASI SCROLL
  //==============================================//
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  function observeElements() {
    const elementsToAnimate = document.querySelectorAll(".animate-on-scroll");
    elementsToAnimate.forEach((el) => observer.observe(el));
  }

  // Mulai aplikasi
  showPage("#home"); // Atur halaman awal saat memuat
  fetchRecipes();
});
