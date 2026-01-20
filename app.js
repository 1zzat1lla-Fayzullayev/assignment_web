function setupMobileMenu() {
  const hamburger = document.querySelector(".hamburger");
  const mobileMenu = document.querySelector(".mobile-menu");

  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener("click", function () {
    this.classList.toggle("active");
    mobileMenu.classList.toggle("active");
  });
}

async function loadProducts() {
  const productTypes = [
    {
      type: "trending",
      elementId: "trending-products",
      file: "./data/trending_products.json",
    },
    {
      type: "new",
      elementId: "new-products",
      file: "./data/new_products.json",
    },
    {
      type: "bestSelling",
      elementId: "best-selling-products",
      file: "./data/best_selling_products.json",
    },
  ];

  try {
    const responses = await Promise.all([
      fetch(productTypes[0].file),
      fetch(productTypes[1].file),
      fetch(productTypes[2].file),
    ]);

    const trendingData = await responses[0].json();
    const newData = await responses[1].json();
    const bestSellingData = await responses[2].json();

    displayProducts(
      trendingData.products,
      productTypes[0].elementId,
      "trending",
    );
    displayProducts(newData.products, productTypes[1].elementId, "new");
    displayProducts(
      bestSellingData.products,
      productTypes[2].elementId,
      "best-selling",
    );

    window.trendingProducts = trendingData.products;
    window.newProducts = newData.products;
    window.bestSellingProducts = bestSellingData.products;
  } catch (error) {
    console.error("Mahsulotlarni yuklashda xato:", error);
    showErrorMessage();
  }
}

function displayProducts(products, containerId, type) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = '<p class="error">Mahsulotlar yo\'q</p>';
    return;
  }

  container.innerHTML = "";

  const desktopGrid = document.createElement("div");
  desktopGrid.className = "products-wrapper";
  desktopGrid.style.display = window.innerWidth <= 768 ? "none" : "grid";

  const mobileSwiper = document.createElement("div");
  mobileSwiper.className = `swiper ${type}-swiper`;
  mobileSwiper.style.display = window.innerWidth <= 768 ? "block" : "none";

  const swiperWrapper = document.createElement("div");
  swiperWrapper.className = "swiper-wrapper";
  mobileSwiper.appendChild(swiperWrapper);

  products.forEach((product) => {
    const productCard = createProductCard(product);
    desktopGrid.appendChild(productCard);

    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    slide.appendChild(createProductCard(product));
    swiperWrapper.appendChild(slide);
  });

  const nextBtn = document.createElement("div");
  nextBtn.className = "swiper-button-next";
  mobileSwiper.appendChild(nextBtn);

  const prevBtn = document.createElement("div");
  prevBtn.className = "swiper-button-prev";
  mobileSwiper.appendChild(prevBtn);

  const pagination = document.createElement("div");
  pagination.className = "swiper-pagination";
  mobileSwiper.appendChild(pagination);

  container.appendChild(desktopGrid);
  container.appendChild(mobileSwiper);

  if (window.innerWidth <= 768) {
    initSwiper(type);
  }

  setTimeout(() => {
    updateFavoriteButtonsState();
  }, 100);
}

function createProductCard(product) {
  const div = document.createElement("div");
  div.className = "product";
  div.dataset.id = product.id;
  div.dataset.name = product.name;
  div.dataset.price = product.price;

  div.innerHTML = `
    <button class="product-fav" aria-label="Sevimlilarga qo'shish">♡</button>
    <img src="${product.image}" alt="${product.name}" class="product_img">
    <div class="product-info">
      <h4>${product.name}</h4>
      <span class="product-nasiya">${product.nasiya || "12 oy"}</span>
      <div class="buy">
        <div class="price">${product.price}</div>
        <button class="cart">
          <img src="/assets/shopping-cart-white.png" alt="Savatcha">
        </button>
      </div>
    </div>
  `;

  return div;
}

const swipers = [];

function initSwiper(type) {
  const swiperEl = document.querySelector(`.${type}-swiper`);
  if (!swiperEl) return;

  const existingIndex = swipers.findIndex((s) => s.el === swiperEl);
  if (existingIndex !== -1) {
    swipers[existingIndex].destroy();
    swipers.splice(existingIndex, 1);
  }

  const swiper = new Swiper(swiperEl, {
    slidesPerView: 1.3,
    spaceBetween: 15,
    navigation: {
      nextEl: swiperEl.querySelector(".swiper-button-next"),
      prevEl: swiperEl.querySelector(".swiper-button-prev"),
    },
    pagination: {
      el: swiperEl.querySelector(".swiper-pagination"),
      clickable: true,
    },
    breakpoints: {
      320: { slidesPerView: 1.2, spaceBetween: 10 },
      480: { slidesPerView: 1.5, spaceBetween: 15 },
      640: { slidesPerView: 2, spaceBetween: 20 },
    },
  });

  swipers.push(swiper);
}

function updateView() {
  const isMobile = window.innerWidth <= 768;

  document.querySelectorAll(".products-wrapper").forEach((el) => {
    el.style.display = isMobile ? "none" : "grid";
  });

  document.querySelectorAll(".swiper").forEach((el) => {
    el.style.display = isMobile ? "block" : "none";
  });

  if (isMobile) {
    ["trending", "new", "bestSelling"].forEach((type) => {
      const el = document.querySelector(`.${type}-swiper`);
      if (el && !swipers.some((s) => s.el === el)) {
        initSwiper(type);
      }
    });
  }
}

function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addItemToCart(product, qty = 1) {
  let cart = getCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      ...product,
      price: parsePrice(product.price),
      qty: qty,
    });
  }

  saveCart(cart);
  updateCartCount();
  alert("Mahsulot savatchaga qo'shildi!");
}

function updateCartCount() {
  const cart = getCart();
  const totalCount = cart.reduce((sum, item) => sum + (item.qty || 0), 0);

  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = totalCount;
    el.classList.toggle("is-hidden", totalCount === 0);
  });
}

function increaseQuantity(productId) {
  let cart = getCart();
  const item = cart.find((item) => item.id === productId);

  if (item) {
    item.qty += 1;
    saveCart(cart);
    updateCartCount();

    if (document.querySelector(".checkout-page")) {
      updateOrderSummary();
    }
    return true;
  }
  return false;
}

function decreaseQuantity(productId) {
  let cart = getCart();
  const itemIndex = cart.findIndex((item) => item.id === productId);

  if (itemIndex !== -1) {
    const item = cart[itemIndex];

    if (item.qty > 1) {
      item.qty -= 1;
    } else {
      if (
        confirm(
          `"${item.name}" mahsulotini savatchadan o'chirishni istaysizmi?`,
        )
      ) {
        cart.splice(itemIndex, 1);
        alert("Mahsulot savatchadan o'chirildi!");
      } else {
        return false;
      }
    }

    saveCart(cart);
    updateCartCount();

    if (document.querySelector(".checkout-page")) {
      updateOrderSummary();
    }
    return true;
  }
  return false;
}

function removeFromCart(productId) {
  let cart = getCart();
  const itemIndex = cart.findIndex((item) => item.id === productId);

  if (itemIndex !== -1) {
    const itemName = cart[itemIndex].name;

    if (
      confirm(`"${itemName}" mahsulotini savatchadan o'chirishni istaysizmi?`)
    ) {
      cart.splice(itemIndex, 1);
      saveCart(cart);
      updateCartCount();
      alert("Mahsulot savatchadan o'chirildi!");

      if (document.querySelector(".checkout-page")) {
        updateOrderSummary();
      }
      return true;
    }
  }
  return false;
}

function getFavorites() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  return favorites.filter((fav) => fav && fav.id);
}

function saveFavorites(favorites) {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function toggleFavorite(button) {
  const card = button.closest("[data-id]");
  if (!card) return;

  const productId = parseInt(card.dataset.id);
  let favorites = getFavorites();
  const exists = favorites.some((p) => p.id === productId);

  if (exists) {
    favorites = favorites.filter((p) => p.id !== productId);
    saveFavorites(favorites);
    updateFavoritesCount();

    if (document.querySelector(".liked-page")) {
      card.remove();

      const grid = document.querySelector(".liked-grid");
      if (grid && grid.children.length === 0) {
        document.querySelector(".liked-empty")?.classList.remove("is-hidden");
      }
    } else {
      button.textContent = "♡";
      button.classList.remove("active");
    }
  } else {
    favorites.push({
      id: productId,
      name: card.dataset.name,
      price: card.dataset.price,
      image: card.querySelector("img")?.src || "",
    });

    saveFavorites(favorites);
    updateFavoritesCount();

    button.textContent = "♥";
    button.classList.add("active");
  }
}

function updateFavoritesCount() {
  const favorites = getFavorites();

  document.querySelectorAll(".fav-count").forEach((el) => {
    el.textContent = favorites.length;
    el.classList.toggle("is-hidden", favorites.length === 0);
  });
}

function updateFavoriteButtonsState() {
  document
    .querySelectorAll(".product-fav, .tile-fav, .related-fav, .season-fav")
    .forEach((button) => {
      const productCard = button.closest(
        ".product, .product-tile, .related-card, .season-card",
      );
      if (!productCard) return;

      const productId = parseInt(productCard.dataset.id) || 0;
      const favorites = getFavorites();
      const isFavorite = favorites.some((item) => item.id === productId);

      if (isFavorite) {
        button.textContent = "♥";
        button.classList.add("active");
      } else {
        button.textContent = "♡";
        button.classList.remove("active");
      }
    });
}

function setupProductPage() {
  const productPage = document.querySelector(".product-page");
  if (!productPage) return;

  const storedProduct = JSON.parse(localStorage.getItem("selectedProduct"));
  if (storedProduct) {
    productPage.dataset.id = storedProduct.id;
    productPage.dataset.name = storedProduct.name;
    productPage.dataset.price = storedProduct.price;
    productPage.dataset.image = storedProduct.image;

    const title = productPage.querySelector("h1");
    const price = productPage.querySelector(".price-block .price");
    const mainImage = productPage.querySelector(".product-main img");

    if (title) title.textContent = storedProduct.name;
    if (price) price.textContent = storedProduct.price;
    if (mainImage) {
      mainImage.src = storedProduct.image;
      mainImage.alt = storedProduct.name;
    }
  }

  productPage.querySelectorAll(".product-thumbs button").forEach((button) => {
    button.addEventListener("click", () => {
      const newImage = button.dataset.image;
      const mainImage = productPage.querySelector(".product-main img");
      if (mainImage && newImage) {
        mainImage.src = newImage;
      }
      productPage.querySelectorAll(".product-thumbs button").forEach((btn) => {
        btn.classList.remove("active");
      });
      button.classList.add("active");
    });
  });

  productPage.querySelectorAll(".qty-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const input = productPage.querySelector(".qty-input");
      if (!input) return;
      const step = parseInt(button.dataset.step) || 1;
      const newValue = parseInt(input.value) + step;
      if (newValue >= 1) {
        input.value = newValue;
      }
    });
  });
}


function setupProductsPage() {
  const productsPage = document.querySelector(".products-page");
  if (!productsPage) return;

  const searchInput = document.querySelector(".products-search");
  const searchBtn = document.querySelector(".search-btn");
  const categoryChips = document.querySelectorAll(".category-chip");
  const filterCheckboxes = document.querySelectorAll("[data-filter]");
  const clearFiltersBtn = document.querySelector(".clear-filters");
  const sortButtons = document.querySelectorAll(".sort-btn");
  const productGrid = document.querySelector(".product-grid");
  const resultsCount = document.querySelector(".results-count");
  const queryText = document.querySelector(".query-text");
  const emptyState = document.querySelector(".empty-state");

  let allProducts = [];
  let currentFilters = {
    search: "",
    category: "all",
    categories: [],
    priceRanges: [],
    colors: [],
    ratings: [],
  };

  function getAllProducts() {
    const tiles = document.querySelectorAll(".product-tile");
    allProducts = Array.from(tiles).map((tile) => ({
      element: tile,
      id: tile.dataset.id,
      name: tile.dataset.name,
      price: parseInt(tile.dataset.price),
      rating: parseFloat(tile.dataset.rating),
      category: tile.dataset.category,
      color: tile.dataset.color,
      created: tile.dataset.created,
    }));
  }

  function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    currentFilters.search = query;
    queryText.textContent = query || "Mahsulotlar";
    filterAndDisplayProducts();
  }

  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  categoryChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      categoryChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");

      currentFilters.category = chip.dataset.category;
      queryText.textContent = chip.dataset.label;

      filterAndDisplayProducts();
    });
  });

  filterCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const filterType = checkbox.dataset.filter;

      if (filterType === "category") {
        const value = checkbox.value;
        if (checkbox.checked) {
          currentFilters.categories.push(value);
        } else {
          currentFilters.categories = currentFilters.categories.filter(
            (c) => c !== value,
          );
        }
      } else if (filterType === "price") {
        const min = parseInt(checkbox.dataset.min) || 0;
        const max = parseInt(checkbox.dataset.max) || Infinity;

        if (checkbox.checked) {
          currentFilters.priceRanges.push({ min, max });
        } else {
          currentFilters.priceRanges = currentFilters.priceRanges.filter(
            (r) => r.min !== min || r.max !== max,
          );
        }
      } else if (filterType === "rating") {
        const minRating = parseFloat(checkbox.dataset.min);
        if (checkbox.checked) {
          currentFilters.ratings.push(minRating);
        } else {
          currentFilters.ratings = currentFilters.ratings.filter(
            (r) => r !== minRating,
          );
        }
      }

      filterAndDisplayProducts();
    });
  });

  document.querySelectorAll("[data-color]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const color = btn.dataset.color;

      if (btn.classList.contains("active")) {
        btn.classList.remove("active");
        currentFilters.colors = currentFilters.colors.filter(
          (c) => c !== color,
        );
      } else {
        btn.classList.add("active");
        currentFilters.colors.push(color);
      }

      filterAndDisplayProducts();
    });
  });

  clearFiltersBtn.addEventListener("click", () => {
    searchInput.value = "";
    currentFilters = {
      search: "",
      category: "all",
      categories: [],
      priceRanges: [],
      colors: [],
      ratings: [],
    };

    filterCheckboxes.forEach((cb) => (cb.checked = false));
    document.querySelectorAll("[data-color]").forEach((btn) => {
      btn.classList.remove("active");
    });

    categoryChips.forEach((chip) => {
      chip.classList.remove("active");
      if (chip.dataset.category === "all") {
        chip.classList.add("active");
      }
    });

    queryText.textContent = "Mahsulotlar";
    filterAndDisplayProducts();
  });

  sortButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      sortButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const sortType = btn.dataset.sort;
      sortProducts(sortType);
    });
  });

  function sortProducts(sortType) {
    const visibleProducts = Array.from(
      productGrid.querySelectorAll(".product-tile:not(.is-hidden)"),
    );

    visibleProducts.sort((a, b) => {
      const priceA = parseInt(a.dataset.price);
      const priceB = parseInt(b.dataset.price);
      const dateA = a.dataset.created;
      const dateB = b.dataset.created;

      if (sortType === "price-asc") {
        return priceA - priceB;
      } else if (sortType === "price-desc") {
        return priceB - priceA;
      } else if (sortType === "newest") {
        return dateB.localeCompare(dateA);
      }
      return 0;
    });

    productGrid.innerHTML = "";
    visibleProducts.forEach((product) => {
      productGrid.appendChild(product);
    });
  }

  function filterAndDisplayProducts() {
    let filteredProducts = [...allProducts];

    if (currentFilters.search) {
      filteredProducts = filteredProducts.filter((p) =>
        p.name.toLowerCase().includes(currentFilters.search),
      );
    }

    if (currentFilters.category !== "all") {
      filteredProducts = filteredProducts.filter(
        (p) => p.category === currentFilters.category,
      );
    }

    if (currentFilters.categories.length > 0) {
      filteredProducts = filteredProducts.filter((p) =>
        currentFilters.categories.includes(p.category),
      );
    }

    if (currentFilters.priceRanges.length > 0) {
      filteredProducts = filteredProducts.filter((p) => {
        return currentFilters.priceRanges.some(
          (range) => p.price >= range.min && p.price <= range.max,
        );
      });
    }
    if (currentFilters.colors.length > 0) {
      filteredProducts = filteredProducts.filter((p) =>
        currentFilters.colors.includes(p.color),
      );
    }
    if (currentFilters.ratings.length > 0) {
      const minRating = Math.min(...currentFilters.ratings);
      filteredProducts = filteredProducts.filter((p) => p.rating >= minRating);
    }

    displayFilteredProducts(filteredProducts);
  }

  function displayFilteredProducts(products) {
    allProducts.forEach((p) => {
      p.element.classList.add("is-hidden");
      p.element.style.display = "none";
    });

    products.forEach((p) => {
      p.element.classList.remove("is-hidden");
      p.element.style.display = "block";
    });

    resultsCount.textContent = products.length;

    if (products.length === 0) {
      emptyState.classList.remove("is-hidden");
    } else {
      emptyState.classList.add("is-hidden");
    }
    updateFavoriteButtonsState();
  }
  getAllProducts();
}

function setupCheckoutPage() {
  const checkoutPage = document.querySelector(".checkout-page");
  if (!checkoutPage) return;

  checkoutPage.querySelectorAll(".delivery-option").forEach((option) => {
    option.addEventListener("click", function () {
      checkoutPage
        .querySelectorAll(".delivery-option")
        .forEach((o) => o.classList.remove("active"));
      this.classList.add("active");

      const addressFields = checkoutPage.querySelector(".address-fields");
      if (addressFields) {
        const isPickup = this.dataset.method === "pickup";
        addressFields.style.display = isPickup ? "none" : "block";
        addressFields.querySelectorAll("input, select").forEach((input) => {
          input.disabled = isPickup;
          if (isPickup) {
            input.value = "";
          }
        });
      }
    });
  });

  updateOrderSummary();
}

function updateOrderSummary() {
  const cart = getCart();
  const summaryItems = document.querySelector(".summary-items");
  const summaryEmpty = document.querySelector(".summary-empty");
  const totals = document.querySelector(".summary-totals");

  if (!summaryItems || !totals) return;

  if (cart.length === 0) {
    if (summaryEmpty) summaryEmpty.classList.remove("is-hidden");
    summaryItems.innerHTML = "";
    totals.dataset.subtotal = "0";
    totals.dataset.shipping = "0";
    totals.dataset.discount = "0";
    updateTotals();
    return;
  }

  if (summaryEmpty) summaryEmpty.classList.add("is-hidden");

  summaryItems.innerHTML = "";
  let subtotal = 0;

  cart.forEach((item) => {
    const price = item.price || parsePrice(item.price);
    const itemTotal = price * (item.qty || 1);
    subtotal += itemTotal;

    const itemDiv = document.createElement("div");
    itemDiv.className = "summary-item";
    itemDiv.innerHTML = `
      <div class="summary-item-img">
        <img src="${item.image || "../assets/product.png"}" alt="${item.name}">
      </div>
      <div class="summary-info">
        <strong>${item.name}</strong>
        <div class="summary-qty">
          <button type="button" class="qty-btn" data-action="decrease" data-id="${item.id}">-</button>
          <span class="qty-value">${item.qty || 1}</span>
          <button type="button" class="qty-btn" data-action="increase" data-id="${item.id}">+</button>
          <button type="button" class="summary-remove" data-action="remove" data-id="${item.id}">
            O'chirish
          </button>
        </div>
      </div>
      <span class="item-total">${formatPrice(itemTotal)}</span>
    `;
    summaryItems.appendChild(itemDiv);
  });

  const shipping = subtotal > 0 ? 30000 : 0;
  const discount = parseFloat(totals.dataset.discount) || 0;

  totals.dataset.subtotal = subtotal.toString();
  totals.dataset.shipping = shipping.toString();
  totals.dataset.discount = discount.toString();

  updateTotals();
}

function updateTotals() {
  const totals = document.querySelector(".summary-totals");
  if (!totals) return;

  const subtotal = parseFloat(totals.dataset.subtotal) || 0;
  const shipping = parseFloat(totals.dataset.shipping) || 0;
  const discount = parseFloat(totals.dataset.discount) || 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const subtotalEl = document.querySelector(".summary-subtotal");
  const shippingEl = document.querySelector(".summary-shipping");
  const discountEl = document.querySelector(".summary-discount");
  const totalEl = document.querySelector(".summary-total");

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (shippingEl) shippingEl.textContent = formatPrice(shipping);
  if (discountEl) discountEl.textContent = `-${formatPrice(discount)}`;
  if (totalEl) totalEl.textContent = formatPrice(total);
}

function formatPrice(amount) {
  const number = parseInt(amount) || 0;
  return new Intl.NumberFormat("uz-UZ").format(number) + " so'm";
}

function parsePrice(priceString) {
  if (!priceString) return 0;
  const cleaned = priceString.toString().replace(/[^\d]/g, "");
  const number = parseInt(cleaned) || 0;
  return number;
}

function setupGlobalEventHandler() {
  if (window.globalHandlerSetup) return;

  document.addEventListener("click", function (e) {
    const target = e.target;
    const cartButton = target.closest(
      ".cart, .tile-cart, .mini-cart, .add-to-cart-season, .product-cart",
    );

    if (cartButton) {
      e.preventDefault();
      e.stopPropagation();

      let productData = null;
      let quantity = 1;

      if (cartButton.classList.contains("cart")) {
        const productCard = cartButton.closest(
          ".product, .liked-card, .product-tile, .season-card, .related-card",
        );

        if (productCard) {
          productData = {
            id: parseInt(productCard.dataset.id) || 0,
            name: productCard.dataset.name || "Mahsulot",
            price: productCard.dataset.price || "0",
            image: productCard.querySelector("img")?.src || "",
          };
        }
      } else if (cartButton.classList.contains("add-to-cart-season")) {
        productData = {
          id: parseInt(cartButton.dataset.id) || 0,
          name: cartButton.dataset.name || "Mahsulot",
          price: cartButton.dataset.price || "0",
          image:
            cartButton.closest(".season-card")?.querySelector("img")?.src || "",
        };
      } else if (cartButton.classList.contains("tile-cart")) {
        const productTile = cartButton.closest(".product-tile");
        if (productTile) {
          productData = {
            id: parseInt(productTile.dataset.id) || 0,
            name: productTile.dataset.name || "Mahsulot",
            price: productTile.dataset.price || "0",
            image: productTile.querySelector("img")?.src || "",
          };
        }
      } else if (cartButton.classList.contains("mini-cart")) {
        const relatedCard = cartButton.closest(".related-card");
        if (relatedCard) {
          productData = {
            id: parseInt(relatedCard.dataset.id) || 0,
            name: relatedCard.dataset.name || "Mahsulot",
            price: relatedCard.dataset.price || "0",
            image: relatedCard.querySelector("img")?.src || "",
          };
        }
      } else if (cartButton.classList.contains("product-cart")) {
        const productPage = document.querySelector(".product-page");
        if (productPage) {
          productData = {
            id: parseInt(productPage.dataset.id) || 0,
            name: productPage.dataset.name || "Mahsulot",
            price: productPage.dataset.price || "0",
            image: productPage.querySelector(".product-main img")?.src || "",
          };
          quantity = parseInt(document.querySelector(".qty-input")?.value) || 1;
        }
      }

      if (productData) {
        addItemToCart(productData, quantity);
      }
    }
  });

  document.addEventListener("click", function (e) {
    const target = e.target;
    const favButton = target.closest(
      ".product-fav, .tile-fav, .related-fav, .season-fav",
    );

    if (favButton) {
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(favButton);
    }
  });

  document.addEventListener("click", function (e) {
    const target = e.target;
    const qtyButton = target.closest("[data-action]");

    if (qtyButton && qtyButton.dataset.action && qtyButton.dataset.id) {
      e.preventDefault();
      e.stopPropagation();

      const action = qtyButton.dataset.action;
      const productId = parseInt(qtyButton.dataset.id);

      switch (action) {
        case "increase":
          increaseQuantity(productId);
          break;
        case "decrease":
          decreaseQuantity(productId);
          break;
        case "remove":
          removeFromCart(productId);
          break;
      }
    }
  });

  document.addEventListener("click", function (e) {
    const target = e.target;

    if (target.closest("button") || target.tagName === "BUTTON") {
      return;
    }

    const productCard = target.closest(
      ".product, .season-card, .related-card, .product-tile",
    );

    if (productCard) {
      let productData = null;

      if (productCard.classList.contains("product")) {
        productData = {
          id: parseInt(productCard.dataset.id) || 0,
          name: productCard.dataset.name || "Mahsulot",
          price: productCard.dataset.price || "0",
          image: productCard.querySelector("img")?.src || "",
        };
      } else if (productCard.classList.contains("season-card")) {
        const btn = productCard.querySelector(".add-to-cart-season");
        if (btn) {
          productData = {
            id: parseInt(btn.dataset.id) || 0,
            name: btn.dataset.name || "Mahsulot",
            price: btn.dataset.price || "0",
            image: productCard.querySelector("img")?.src || "",
          };
        }
      } else if (
        productCard.classList.contains("related-card") ||
        productCard.classList.contains("product-tile")
      ) {
        productData = {
          id: parseInt(productCard.dataset.id) || 0,
          name: productCard.dataset.name || "Mahsulot",
          price: productCard.dataset.price || "0",
          image: productCard.querySelector("img")?.src || "",
        };
      }

      if (productData) {
        localStorage.setItem("selectedProduct", JSON.stringify(productData));
        window.location.href = "./product.html";
      }
    }
  });

  window.globalHandlerSetup = true;
}

function renderLikedProducts() {
  const grid = document.querySelector(".liked-grid");
  const empty = document.querySelector(".liked-empty");
  const favorites = getFavorites();

  if (!grid) return;

  grid.innerHTML = "";

  if (favorites.length === 0) {
    empty.classList.remove("is-hidden");
    return;
  }

  empty.classList.add("is-hidden");

  favorites.forEach((p) => {
    const div = document.createElement("div");
    div.className = "liked-card";
    div.dataset.id = p.id;
    div.dataset.name = p.name;
    div.dataset.price = p.price;

    div.innerHTML = `
      <img src="${p.image}" class="liked-img" alt="${p.name}">
      <div class="liked-title">${p.name}</div>
      <div class="liked-bottom">
        <div class="liked-price">${formatPrice(p.price)}</div>
        <div class="liked-actions">
          <button class="liked-remove product-fav active">♥</button>
          <button class="liked-cart cart">Savat</button>
        </div>
      </div>
    `;

    grid.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM yuklandi");

  setupMobileMenu();

  const hasProductContainers =
    document.getElementById("trending-products") ||
    document.getElementById("new-products") ||
    document.getElementById("best-selling-products");

  if (hasProductContainers) {
    loadProducts();
  }
  if (document.querySelector(".liked-page")) {
    renderLikedProducts();
  }

  if (document.querySelector(".product-page")) {
    setupProductPage();
  }

  if (document.querySelector(".products-page")) {
    setupProductsPage();
  }

  if (document.querySelector(".checkout-page")) {
    setupCheckoutPage();
  }

  setupGlobalEventHandler();

  updateCartCount();
  updateFavoritesCount();

  window.addEventListener("resize", function () {
    updateView();
  });

  console.log("Barcha funksiyalar sozlandi");
});
