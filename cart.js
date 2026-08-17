/* ============================================
   PARAIHSSANE — Cart Module
   ============================================ */

const Cart = (() => {
  const STORAGE_KEY = 'paraihssane_cart';
  const WHATSAPP_NUMBER = '212665469795';

  let cart = [];
  let listeners = [];

  function init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        cart = JSON.parse(stored);
      } catch (e) {
        cart = [];
      }
    }
    updateBadge();
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    updateBadge();
    listeners.forEach(fn => fn(cart));
  }

  function subscribe(fn) {
    listeners.push(fn);
  }

  function addItem(productId, quantity = 1) {
    const product = Products.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity: quantity
      });
    }
    save();
    animateBadge();
    return true;
  }

  function removeItem(productId) {
    cart = cart.filter(item => item.id !== productId);
    save();
  }

  function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    const item = cart.find(item => item.id === productId);
    if (item) {
      item.quantity = quantity;
      save();
    }
  }

  function getCart() {
    return [...cart];
  }

  function getTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function getCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function clearCart() {
    cart = [];
    save();
  }

  function updateBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = getCount();
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  function animateBadge() {
    const icons = document.querySelectorAll('.cart-icon-wrap');
    icons.forEach(icon => {
      icon.classList.add('cart-bounce');
      setTimeout(() => icon.classList.remove('cart-bounce'), 400);
    });
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
      badge.classList.add('badge-pulse');
      setTimeout(() => badge.classList.remove('badge-pulse'), 400);
    });
  }

  function isInCart(productId) {
    return cart.some(item => item.id === productId);
  }

  function getItemQuantity(productId) {
    const item = cart.find(i => i.id === productId);
    return item ? item.quantity : 0;
  }

  function generateWhatsAppMessage() {
    if (cart.length === 0) return null;

    let msg = 'Bonjour Paraihssane,\n\nJe souhaite passer la commande suivante :\n\n';
    cart.forEach(item => {
      const lineTotal = item.price * item.quantity;
      msg += `- ${item.name} ×${item.quantity} — ${lineTotal} DH\n`;
    });
    msg += `\nTotal : ${getTotal()} DH\n\nMerci.`;
    return msg;
  }

  function generateSingleProductMessage(product) {
    return `Bonjour Paraihssane,\n\nJe souhaite commander :\n\nProduit : ${product.name}\nPrix : ${product.price} DH\nQuantité : 1\n\nMerci.`;
  }

  function openWhatsApp(message) {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  function orderCart() {
    const msg = generateWhatsAppMessage();
    if (!msg) {
      showCartToast('Votre panier est vide. Ajoutez d\'abord un produit.');
      return;
    }
    openWhatsApp(msg);
  }

  function orderSingle(product) {
    const msg = generateSingleProductMessage(product);
    openWhatsApp(msg);
  }

  function showCartToast(message) {
    const existing = document.querySelector('.cart-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function renderCartDrawer() {
    const drawer = document.querySelector('.cart-drawer');
    const overlay = document.querySelector('.cart-overlay');
    if (!drawer) return;

    const items = getCart();
    const total = getTotal();
    const count = getCount();

    let html = `
      <div class="cart-drawer-header">
        <h3>Panier <span class="cart-count-label">(${count} articles)</span></h3>
        <button class="cart-close-btn" aria-label="Fermer le panier">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;

    if (items.length === 0) {
      html += `
        <div class="cart-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <p>Votre panier est vide</p>
          <a href="shop.html" class="btn btn-primary btn-sm">Découvrir la boutique</a>
        </div>
      `;
    } else {
      html += `<div class="cart-items">`;
      items.forEach(item => {
        html += `
          <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-img">
              <img src="${item.image}" alt="${item.name}" loading="lazy">
            </div>
            <div class="cart-item-info">
              <span class="cart-item-category">${item.category}</span>
              <h4 class="cart-item-name">${item.name}</h4>
              <span class="cart-item-price">${item.price} DH</span>
            </div>
            <div class="cart-item-controls">
              <div class="qty-control">
                <button class="qty-btn qty-minus" data-id="${item.id}" aria-label="Diminuer la quantité">−</button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-btn qty-plus" data-id="${item.id}" aria-label="Augmenter la quantité">+</button>
              </div>
              <button class="cart-item-remove" data-id="${item.id}" aria-label="Retirer ${item.name}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        `;
      });
      html += `</div>`;

      html += `
        <div class="cart-footer">
          <div class="cart-total-row">
            <span>Total</span>
            <span class="cart-total-value">${total} DH</span>
          </div>
          <button class="btn btn-whatsapp btn-full cart-order-btn" id="cartOrderBtn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Commander sur WhatsApp
          </button>
          <button class="btn btn-outline btn-full btn-sm" id="clearCartBtn">Vider le panier</button>
        </div>
      `;
    }

    drawer.innerHTML = html;
    bindCartDrawerEvents();
  }

  function bindCartDrawerEvents() {
    const closeBtn = document.querySelector('.cart-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeCart);

    document.querySelectorAll('.qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const item = cart.find(i => i.id === id);
        if (item) updateQuantity(id, item.quantity - 1);
        renderCartDrawer();
      });
    });

    document.querySelectorAll('.qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const item = cart.find(i => i.id === id);
        if (item) updateQuantity(id, item.quantity + 1);
        renderCartDrawer();
      });
    });

    document.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        removeItem(parseInt(btn.dataset.id));
        renderCartDrawer();
      });
    });

    const orderBtn = document.getElementById('cartOrderBtn');
    if (orderBtn) orderBtn.addEventListener('click', orderCart);

    const clearBtn = document.getElementById('clearCartBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => {
      clearCart();
      renderCartDrawer();
    });
  }

  function openCart() {
    renderCartDrawer();
    document.body.classList.add('cart-open');
    document.querySelector('.cart-drawer')?.classList.add('open');
    document.querySelector('.cart-overlay')?.classList.add('open');
  }

  function closeCart() {
    document.body.classList.remove('cart-open');
    document.querySelector('.cart-drawer')?.classList.remove('open');
    document.querySelector('.cart-overlay')?.classList.remove('open');
  }

  function toggleCart() {
    const drawer = document.querySelector('.cart-drawer');
    if (drawer && drawer.classList.contains('open')) {
      closeCart();
    } else {
      openCart();
    }
  }

  return {
    init,
    addItem,
    removeItem,
    updateQuantity,
    getCart,
    getTotal,
    getCount,
    clearCart,
    isInCart,
    getItemQuantity,
    orderCart,
    orderSingle,
    openCart,
    closeCart,
    toggleCart,
    subscribe,
    updateBadge,
    showCartToast,
    WHATSAPP_NUMBER
  };
})();
