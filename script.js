/* ============================================
   PARAIHSSANE — Main Script
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  Cart.init();
  initNavigation();
  initMobileMenu();
  initSearch();
  initFilters();
  initSort();
  initProductModals();
  initScrollAnimations();
  initContactForm();
  initProductButtons();
  initProductGrid();
  initCategoryLinks();
  Cart.subscribe(() => initProductButtons());
});

/* ----------------------------------------
   Navigation
   ---------------------------------------- */
function initNavigation() {
  const header = document.querySelector('.site-header');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  }, { passive: true });

  document.querySelectorAll('.cart-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      Cart.toggleCart();
    });
  });

  document.querySelector('.cart-overlay')?.addEventListener('click', Cart.closeCart);
}

/* ----------------------------------------
   Mobile Menu
   ---------------------------------------- */
function initMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const overlay = document.querySelector('.menu-overlay');

  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('open');
    overlay?.classList.toggle('open');
    document.body.classList.toggle('menu-open');
  });

  overlay?.addEventListener('click', closeMobileMenu);

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  function closeMobileMenu() {
    hamburger.classList.remove('active');
    mobileMenu.classList.remove('open');
    overlay?.classList.remove('open');
    document.body.classList.remove('menu-open');
  }
}

/* ----------------------------------------
   Search
   ---------------------------------------- */
function initSearch() {
  const searchToggle = document.querySelector('.search-toggle');
  const searchOverlay = document.querySelector('.search-overlay');
  const searchInput = document.querySelector('.search-input');
  const searchClose = document.querySelector('.search-close');
  const searchResults = document.querySelector('.search-results');

  if (!searchToggle) return;

  searchToggle.addEventListener('click', () => {
    searchOverlay.classList.add('open');
    setTimeout(() => searchInput?.focus(), 200);
  });

  searchClose?.addEventListener('click', () => {
    searchOverlay.classList.remove('open');
    if (searchInput) searchInput.value = '';
    if (searchResults) searchResults.innerHTML = '';
  });

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length < 2) {
          searchResults.innerHTML = '';
          return;
        }
        const results = Products.filter(p =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
        );
        renderSearchResults(results, searchResults);
      }, 200);
    });
  }
}

function renderSearchResults(results, container) {
  if (results.length === 0) {
    container.innerHTML = '<p class="search-no-results">Aucun produit trouvé</p>';
    return;
  }
  container.innerHTML = results.slice(0, 8).map(p => `
    <a href="shop.html?product=${p.id}" class="search-result-item">
      <img src="${p.image}" alt="${p.name}" loading="lazy" width="48" height="48">
      <div>
        <span class="search-result-name">${p.name}</span>
        <span class="search-result-price">${p.price} DH</span>
      </div>
    </a>
  `).join('');
}

/* ----------------------------------------
   Filters & Sort (Shop Page)
   ---------------------------------------- */
function initFilters() {
  const filterChips = document.querySelectorAll('.filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const category = chip.dataset.category;
      filterProducts(category, getCurrentSort());
    });
  });
}

function initSort() {
  const sortSelect = document.querySelector('.sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const activeCategory = document.querySelector('.filter-chip.active')?.dataset.category || 'all';
      filterProducts(activeCategory, sortSelect.value);
    });
  }
}

function getCurrentSort() {
  return document.querySelector('.sort-select')?.value || 'default';
}

function filterProducts(category, sort) {
  let filtered = category === 'all'
    ? [...Products]
    : Products.filter(p => p.category.toLowerCase() === category.toLowerCase());

  switch (sort) {
    case 'price-asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'new':
      filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      break;
    case 'promo':
      filtered = filtered.filter(p => p.promotion);
      break;
  }

  renderProductGrid(filtered);
}

/* ----------------------------------------
   Product Grid
   ---------------------------------------- */
function initProductGrid() {
  const grid = document.querySelector('[data-product-grid]');
  if (!grid) return;

  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');
  const searchParam = urlParams.get('search');

  if (categoryParam) {
    document.querySelectorAll('.filter-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.category === categoryParam);
    });
  }

  let displayProducts = [...Products];
  if (categoryParam && categoryParam !== 'all') {
    displayProducts = displayProducts.filter(p => p.category.toLowerCase() === categoryParam.toLowerCase());
  }
  if (searchParam) {
    const q = searchParam.toLowerCase();
    displayProducts = displayProducts.filter(p =>
      p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }

  renderProductGrid(displayProducts);
}

function renderProductGrid(products) {
  const grid = document.querySelector('[data-product-grid]');
  if (!grid) return;

  const countEl = document.querySelector('.product-count');
  if (countEl) countEl.textContent = `${products.length} produit${products.length > 1 ? 's' : ''}`;

  if (products.length === 0) {
    grid.innerHTML = '<p class="no-products">Aucun produit trouvé.</p>';
    return;
  }

  grid.innerHTML = products.map(p => createProductCard(p)).join('');
  initProductButtons();
  observeNewElements(grid);
}

function createProductCard(product) {
  const inCart = Cart.isInCart(product.id);
  const qty = Cart.getItemQuantity(product.id);
  let badge = '';
  if (product.promotion) badge = '<span class="product-badge badge-promo">Promo</span>';
  else if (product.isNew) badge = '<span class="product-badge badge-new">Nouveau</span>';
  else if (product.isBestSeller) badge = '<span class="product-badge badge-best">Best seller</span>';

  const oldPriceHTML = product.oldPrice
    ? `<span class="product-old-price">${product.oldPrice} DH</span>`
    : '';

  return `
    <article class="product-card" data-product-id="${product.id}">
      <div class="product-card-img-wrap">
        ${badge}
        <img src="${product.image}" alt="${product.name}" class="product-card-img" loading="lazy">
        <button class="product-quick-view" data-id="${product.id}" aria-label="Voir ${product.name}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
      <div class="product-card-body">
        <span class="product-card-category">${product.category}</span>
        <h3 class="product-card-name">${product.name}</h3>
        <div class="product-card-prices">
          <span class="product-card-price">${product.price} DH</span>
          ${oldPriceHTML}
        </div>
        <div class="product-card-actions">
          <button class="btn btn-primary btn-sm add-to-cart-btn ${inCart ? 'added' : ''}" data-id="${product.id}">
            ${inCart ? `Ajouté ✓ (${qty})` : 'Ajouter au panier'}
          </button>
          <button class="btn btn-whatsapp-icon whatsapp-order-btn" data-id="${product.id}" aria-label="Commander ${product.name} sur WhatsApp">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </button>
        </div>
      </div>
    </article>
  `;
}

/* ----------------------------------------
   Product Buttons
   ---------------------------------------- */
function initProductButtons() {
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.removeEventListener('click', handleAddToCart);
    btn.addEventListener('click', handleAddToCart);
  });

  document.querySelectorAll('.whatsapp-order-btn').forEach(btn => {
    btn.removeEventListener('click', handleWhatsAppOrder);
    btn.addEventListener('click', handleWhatsAppOrder);
  });

  document.querySelectorAll('.product-quick-view').forEach(btn => {
    btn.removeEventListener('click', handleQuickView);
    btn.addEventListener('click', handleQuickView);
  });
}

function handleAddToCart(e) {
  const btn = e.currentTarget;
  const id = parseInt(btn.dataset.id);
  const product = Products.find(p => p.id === id);
  if (!product) return;

  Cart.addItem(id);
  const qty = Cart.getItemQuantity(id);
  btn.classList.add('added');
  btn.textContent = `Ajouté ✓ (${qty})`;
  Cart.showCartToast(`${product.name} ajouté au panier`);
}

function handleWhatsAppOrder(e) {
  const id = parseInt(e.currentTarget.dataset.id);
  const product = Products.find(p => p.id === id);
  if (product) Cart.orderSingle(product);
}

function handleQuickView(e) {
  const id = parseInt(e.currentTarget.dataset.id);
  const product = Products.find(p => p.id === id);
  if (product) openProductModal(product);
}

/* ----------------------------------------
   Product Modal
   ---------------------------------------- */
function initProductModals() {
  document.querySelector('.modal-overlay')?.addEventListener('click', closeProductModal);
}

function openProductModal(product) {
  let modal = document.querySelector('.product-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'product-modal';
    document.body.appendChild(modal);
  }

  const inCart = Cart.isInCart(product.id);
  const qty = Cart.getItemQuantity(product.id);
  const oldPriceHTML = product.oldPrice
    ? `<span class="modal-old-price">${product.oldPrice} DH</span>`
    : '';

  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content" role="dialog" aria-label="${product.name}">
      <button class="modal-close" aria-label="Fermer">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="modal-body">
        <div class="modal-image">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
        </div>
        <div class="modal-info">
          <span class="modal-category">${product.category}</span>
          <h2 class="modal-title">${product.name}</h2>
          <div class="modal-prices">
            <span class="modal-price">${product.price} DH</span>
            ${oldPriceHTML}
          </div>
          <p class="modal-description">${product.description || 'Découvrez ce produit de qualité de Paraihssane.'}</p>
          <div class="modal-qty">
            <label>Quantité</label>
            <div class="qty-control">
              <button class="qty-btn modal-qty-minus">−</button>
              <span class="qty-value modal-qty-value">1</span>
              <button class="qty-btn modal-qty-plus">+</button>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-primary modal-add-cart ${inCart ? 'added' : ''}" data-id="${product.id}">
              ${inCart ? `Ajouté ✓ (${qty})` : 'Ajouter au panier'}
            </button>
            <button class="btn btn-whatsapp modal-whatsapp" data-id="${product.id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Commander sur WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.classList.add('modal-open');

  let modalQty = 1;
  const qtyValue = modal.querySelector('.modal-qty-value');

  modal.querySelector('.modal-qty-minus')?.addEventListener('click', () => {
    if (modalQty > 1) { modalQty--; qtyValue.textContent = modalQty; }
  });
  modal.querySelector('.modal-qty-plus')?.addEventListener('click', () => {
    modalQty++; qtyValue.textContent = modalQty;
  });

  modal.querySelector('.modal-close')?.addEventListener('click', closeProductModal);
  modal.querySelector('.modal-overlay')?.addEventListener('click', closeProductModal);

  modal.querySelector('.modal-add-cart')?.addEventListener('click', () => {
    Cart.addItem(product.id, modalQty);
    const btn = modal.querySelector('.modal-add-cart');
    btn.classList.add('added');
    const newQty = Cart.getItemQuantity(product.id);
    btn.textContent = `Ajouté ✓ (${newQty})`;
    Cart.showCartToast(`${product.name} ajouté au panier`);
  });

  modal.querySelector('.modal-whatsapp')?.addEventListener('click', () => {
    const msg = `Bonjour Paraihssane,\n\nJe souhaite commander :\n\nProduit : ${product.name}\nPrix : ${product.price} DH\nQuantité : ${modalQty}\n\nMerci.`;
    Cart.openWhatsApp(msg);
  });

  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeProductModal();
      document.removeEventListener('keydown', escHandler);
    }
  });
}

function closeProductModal() {
  const modal = document.querySelector('.product-modal');
  if (modal) {
    modal.remove();
    document.body.classList.remove('modal-open');
  }
}

/* ----------------------------------------
   Category Links
   ---------------------------------------- */
function initCategoryLinks() {
  document.querySelectorAll('[data-category-link]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = link.dataset.categoryLink;
      window.location.href = `shop.html?category=${encodeURIComponent(cat)}`;
    });
  });
}

/* ----------------------------------------
   Scroll Animations
   ---------------------------------------- */
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal, .reveal-up, .reveal-left, .reveal-right, .stagger-item').forEach(el => {
    observer.observe(el);
  });
}

function observeNewElements(container) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  container.querySelectorAll('.reveal, .stagger-item').forEach(el => observer.observe(el));
}

/* ----------------------------------------
   Contact Form
   ---------------------------------------- */
function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll('[required]').forEach(field => {
      const errorEl = field.parentElement.querySelector('.field-error');
      if (!field.value.trim()) {
        valid = false;
        field.classList.add('error');
        if (errorEl) errorEl.textContent = 'Ce champ est requis';
      } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        valid = false;
        field.classList.add('error');
        if (errorEl) errorEl.textContent = 'Email invalide';
      } else if (field.type === 'tel' && field.value.replace(/\s/g, '').length < 9) {
        valid = false;
        field.classList.add('error');
        if (errorEl) errorEl.textContent = 'Numéro invalide';
      } else {
        field.classList.remove('error');
        if (errorEl) errorEl.textContent = '';
      }
    });

    if (valid) {
      const successEl = form.querySelector('.form-success');
      if (successEl) {
        successEl.classList.add('show');
        form.reset();
        setTimeout(() => successEl.classList.remove('show'), 5000);
      }
    }
  });

  form.querySelectorAll('[required]').forEach(field => {
    field.addEventListener('input', () => {
      field.classList.remove('error');
      const errorEl = field.parentElement.querySelector('.field-error');
      if (errorEl) errorEl.textContent = '';
    });
  });
}
