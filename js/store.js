/**
 * store.js — Centralized reactive state management
 * Singleton with event-driven updates, persistent localStorage
 * Keys: aztech_cart, aztech_favs, aztech_cmp
 */

const Store = (() => {
  // ── State ──────────────────────────────────────────────────────────────────
  const state = {
    cart:       JSON.parse(localStorage.getItem('aztech_cart') || '[]'),
    favorites:  JSON.parse(localStorage.getItem('aztech_favs') || '[]'),
    comparison: JSON.parse(localStorage.getItem('aztech_cmp')  || '[]'),
    products:   [],
    filtered:   [],
    searchQuery:    '',
    activeCategory: 'all',
    sortBy:         'default',
    priceRange:     { min: 0, max: 99999 },
    cartOpen:       false,
    compareOpen:    false,
  };

  // ── Pub/Sub ────────────────────────────────────────────────────────────────
  const listeners = {};

  function on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
    return () => { listeners[event] = listeners[event].filter(cb => cb !== callback); };
  }

  function emit(event, data) {
    (listeners[event] || []).forEach(cb => cb(data));
  }

  // ── Persistence ────────────────────────────────────────────────────────────
  function persist() {
    localStorage.setItem('aztech_cart', JSON.stringify(state.cart));
    localStorage.setItem('aztech_favs', JSON.stringify(state.favorites));
    localStorage.setItem('aztech_cmp',  JSON.stringify(state.comparison));
  }

  // ── Price Utilities ────────────────────────────────────────────────────────
  function parsePrice(str) {
    if (!str) return 0;
    const m = String(str).replace(/\s+/g, '').match(/(\d+)₼/);
    return m ? parseInt(m[1]) : 0;
  }

  function parseOriginalPrice(str) {
    if (!str) return null;
    const matches = String(str).replace(/\s+/g, '').match(/(\d+)₼/g);
    return (matches && matches.length > 1) ? parseInt(matches[1]) : null;
  }

  function getDiscount(str) {
    const cur = parsePrice(str);
    const orig = parseOriginalPrice(str);
    if (orig && orig > cur) return Math.round(((orig - cur) / orig) * 100);
    return 0;
  }

  // Build normalized price display strings
  function getPriceDisplay(str) {
    const cur = parsePrice(str);
    const orig = parseOriginalPrice(str);
    return { current: cur, original: orig, discount: getDiscount(str) };
  }

  // ── Cart ───────────────────────────────────────────────────────────────────
  function addToCart(product) {
    const existing = state.cart.find(i => i.id === product.id);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      state.cart.push({ ...product, qty: 1 });
    }
    persist();
    emit('cart:update', [...state.cart]);
    emit('toast', { type: 'success', msg: `Səbətə əlavə edildi` });
  }

  function removeFromCart(id) {
    state.cart = state.cart.filter(i => i.id !== id);
    persist();
    emit('cart:update', [...state.cart]);
  }

  function updateQty(id, qty) {
    if (qty < 1) { removeFromCart(id); return; }
    const item = state.cart.find(i => i.id === id);
    if (item) item.qty = qty;
    persist();
    emit('cart:update', [...state.cart]);
  }

  function clearCart() {
    state.cart = [];
    persist();
    emit('cart:update', []);
  }

  function cartTotal() {
    return state.cart.reduce((s, i) => s + parsePrice(i.price) * (i.qty || 1), 0);
  }

  function cartCount() {
    return state.cart.reduce((s, i) => s + (i.qty || 1), 0);
  }

  function isInCart(id) {
    return state.cart.some(i => i.id === id);
  }

  // ── Favorites ──────────────────────────────────────────────────────────────
  function toggleFavorite(product) {
    const idx = state.favorites.findIndex(i => i.id === product.id);
    if (idx > -1) {
      state.favorites.splice(idx, 1);
      emit('toast', { type: 'info', msg: 'Sevimlilərdan silindi' });
    } else {
      state.favorites.push({ ...product });
      emit('toast', { type: 'success', msg: 'Sevimlilərə əlavə edildi' });
    }
    persist();
    emit('favorites:update', [...state.favorites]);
  }

  function isFavorite(id) {
    return state.favorites.some(i => i.id === id);
  }

  // ── Comparison ─────────────────────────────────────────────────────────────
  function toggleCompare(product) {
    const idx = state.comparison.findIndex(i => i.id === product.id);
    if (idx > -1) {
      state.comparison.splice(idx, 1);
    } else {
      if (state.comparison.length >= 4) {
        emit('toast', { type: 'warning', msg: 'Maksimum 4 məhsul müqayisə edilə bilər' });
        return;
      }
      state.comparison.push({ ...product });
      emit('toast', { type: 'info', msg: 'Müqayisəyə əlavə edildi' });
    }
    persist();
    emit('comparison:update', [...state.comparison]);
  }

  function inComparison(id) {
    return state.comparison.some(i => i.id === id);
  }

  function clearComparison() {
    state.comparison = [];
    persist();
    emit('comparison:update', []);
  }

  // ── Product Filtering ──────────────────────────────────────────────────────
  function setProducts(products) {
    state.products = products;
    applyFilters();
  }

  function setCategory(cat) {
    state.activeCategory = cat;
    applyFilters();
  }

  function setSearch(query) {
    state.searchQuery = query.toLowerCase().trim();
    applyFilters();
  }

  function setSort(sortBy) {
    state.sortBy = sortBy;
    applyFilters();
  }

  function setPriceRange(min, max) {
    state.priceRange = { min: Number(min), max: Number(max) };
    applyFilters();
  }

  function applyFilters() {
    let results = [...state.products];

    if (state.activeCategory !== 'all') {
      results = results.filter(p => p.category === state.activeCategory);
    }

    if (state.searchQuery) {
      results = results.filter(p =>
        p.name.toLowerCase().includes(state.searchQuery) ||
        (p.specs && Object.values(p.specs).some(v =>
          String(v).toLowerCase().includes(state.searchQuery)
        ))
      );
    }

    results = results.filter(p => {
      const price = parsePrice(p.price);
      return price >= state.priceRange.min && price <= state.priceRange.max;
    });

    switch (state.sortBy) {
      case 'price-asc':
        results.sort((a, b) => parsePrice(a.price) - parsePrice(b.price)); break;
      case 'price-desc':
        results.sort((a, b) => parsePrice(b.price) - parsePrice(a.price)); break;
      case 'name-asc':
        results.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'discount':
        results.sort((a, b) => getDiscount(b.price) - getDiscount(a.price)); break;
    }

    state.filtered = results;
    emit('products:filtered', state.filtered);
  }

  // ── UI Panel Toggles ───────────────────────────────────────────────────────
  function openCart()  { state.cartOpen = true;  emit('cart:panel', true); }
  function closeCart() { state.cartOpen = false; emit('cart:panel', false); }
  function toggleCart() { state.cartOpen ? closeCart() : openCart(); }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    on, emit,
    get cart()       { return state.cart; },
    get favorites()  { return state.favorites; },
    get comparison() { return state.comparison; },
    get filtered()   { return state.filtered; },
    get products()   { return state.products; },
    get activeCategory() { return state.activeCategory; },
    get searchQuery()    { return state.searchQuery; },
    get sortBy()         { return state.sortBy; },
    get cartOpen()       { return state.cartOpen; },
    // Cart
    addToCart, removeFromCart, updateQty, clearCart,
    cartTotal, cartCount, isInCart,
    // Favorites
    toggleFavorite, isFavorite,
    // Comparison
    toggleCompare, inComparison, clearComparison,
    // Products
    setProducts, setCategory, setSearch, setSort, setPriceRange, applyFilters,
    // Utilities
    parsePrice, parseOriginalPrice, getDiscount, getPriceDisplay,
    // UI
    openCart, closeCart, toggleCart,
  };
})();