/**
 * app.js — Page orchestration for index.html
 * Fetches all product categories, wires up filters/search/sort,
 * and delegates rendering to UI and state to Store.
 */

const App = (() => {

  const API = 'https://corepcdata.onrender.com';

  const CATEGORIES = [
    { id: 'laptop',    label: 'Noutbuklar',     endpoint: '/laptops',    icon: '💻' },
    { id: 'pc',        label: 'Personal Komp',  endpoint: '/pcomps',     icon: '🖥️' },
    { id: 'monitor',   label: 'Monitorlar',     endpoint: '/monitors',   icon: '🖵' },
    { id: 'component', label: 'Hissələr',       endpoint: '/components', icon: '🔧' },
  ];

  // Normalize raw API product to internal shape
  function normalize(raw, category, index) {
    return {
      id:         `${category}-${index}`,
      name:       raw.name,
      price:      raw.price,
      mainImage:  raw.mainImage,
      additionalImages: raw.additionalImages || [],
      specs:      raw.specs || {},
      category,
      index,
      url:        raw.url || '',
    };
  }

  // Fetch all categories in parallel
  async function fetchAll() {
    const results = await Promise.allSettled(
      CATEGORIES.map(cat =>
        fetch(`${API}${cat.endpoint}`)
          .then(r => r.json())
          .then(items => items.map((item, i) => normalize(item, cat.id, i)))
      )
    );

    const allProducts = [];
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        allProducts.push(...result.value);
      } else {
        console.warn(`Failed to load category ${CATEGORIES[i].id}:`, result.reason);
      }
    });
    return allProducts;
  }

  // Render the product grid
  function renderGrid(products) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    if (products.length === 0) {
      grid.innerHTML = UI.emptyState('Axtarış nəticəsi tapılmadı');
      return;
    }

    const fragment = document.createDocumentFragment();
    products.forEach(p => fragment.appendChild(UI.productCard(p)));
    grid.innerHTML = '';
    grid.appendChild(fragment);

    // Update result count
    const countEl = document.getElementById('result-count');
    if (countEl) countEl.textContent = `${products.length} məhsul`;
  }

  // Wire up category tabs
  function initCategoryTabs() {
    const tabContainer = document.getElementById('category-tabs');
    if (!tabContainer) return;

    tabContainer.addEventListener('click', e => {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      const cat = btn.dataset.cat;
      Store.setCategory(cat);
      // Update active styles
      tabContainer.querySelectorAll('[data-cat]').forEach(b => {
        const isActive = b.dataset.cat === cat;
        b.className = b.className
          .replace(/bg-blue-600 text-white|text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white/g, '')
          .trim();
        b.classList.toggle('bg-blue-600', isActive);
        b.classList.toggle('text-white', isActive);
        if (!isActive) {
          b.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:text-gray-900', 'dark:hover:text-white');
        }
      });
    });
  }

  // Wire up search
  function initSearch() {
    const input = document.getElementById('search-input');
    if (!input) return;
    let debounceTimer;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => Store.setSearch(input.value), 280);
    });
    // Clear button
    const clearBtn = document.getElementById('search-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        Store.setSearch('');
      });
      input.addEventListener('input', () => {
        clearBtn.classList.toggle('hidden', !input.value);
      });
    }
  }

  // Wire up sort select
  function initSort() {
    const sel = document.getElementById('sort-select');
    if (!sel) return;
    sel.addEventListener('change', () => Store.setSort(sel.value));
  }

  // Wire up price range
  function initPriceRange() {
    const minEl = document.getElementById('price-min');
    const maxEl = document.getElementById('price-max');
    if (!minEl || !maxEl) return;
    const apply = () => {
      const min = parseInt(minEl.value) || 0;
      const max = parseInt(maxEl.value) || 99999;
      Store.setPriceRange(min, max);
    };
    minEl.addEventListener('change', apply);
    maxEl.addEventListener('change', apply);
  }

  // Wire up cart sidebar
  function initCartPanel() {
    Store.on('cart:update', () => UI.renderCartSidebar());
    Store.on('cart:panel', () => UI.renderCartSidebar());

    const openBtn = document.getElementById('cart-btn');
    if (openBtn) openBtn.addEventListener('click', () => Store.toggleCart());

    const overlay = document.getElementById('cart-overlay');
    if (overlay) overlay.addEventListener('click', () => Store.closeCart());

    // Initial render
    UI.renderCartSidebar();
  }

  // Main init
  async function init() {
    UI.initDarkMode();
    UI.initToasts();
    initCategoryTabs();
    initSearch();
    initSort();
    initPriceRange();
    initCartPanel();

    // Skeletons while loading
    UI.showSkeletons('product-grid', 12);

    const products = await fetchAll();
    Store.setProducts(products);

    // Subscribe to filter changes
    Store.on('products:filtered', renderGrid);
    Store.on('comparison:update', () => UI.renderCompareBar());

    // Initial render
    renderGrid(Store.filtered);
    UI.renderCompareBar();

    // Theme toggle button
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', UI.toggleDarkMode);
    }
  }

  return { init, fetchAll, normalize, CATEGORIES, API };
})();

document.addEventListener('DOMContentLoaded', App.init);