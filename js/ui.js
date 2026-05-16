/**
 * ui.js — Reusable DOM component renderers
 * All rendering logic lives here. Pages call these functions.
 * Depends on: store.js (must be loaded first)
 */

const UI = (() => {
   // ── Price HTML ─────────────────────────────────────────────────────────────
   function priceHTML(priceStr) {
      const { current, original, discount } = Store.getPriceDisplay(priceStr);
      if (!current) return "";
      let html = `<div class="flex items-center gap-2 flex-wrap">
      <span class="text-emerald-600 dark:text-emerald-400 font-bold text-lg">${current}₼</span>`;
      if (original) {
         html += `<span class="text-gray-400 dark:text-gray-500 line-through text-sm">${original}₼</span>`;
      }
      if (discount > 0) {
         html += `<span class="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-semibold px-1.5 py-0.5 rounded">-${discount}%</span>`;
      }
      html += `</div>`;
      return html;
   }

   // ── Spec Row ───────────────────────────────────────────────────────────────
   function specRows(specs, keys) {
      return keys
         .filter((k) => specs[k])
         .map(
            (k) => `
        <li class="flex gap-1 text-xs text-gray-600 dark:text-gray-400 leading-5">
          <span class="font-medium text-gray-700 dark:text-gray-300 shrink-0">${k}:</span>
          <span class="truncate">${specs[k]}</span>
        </li>`,
         )
         .join("");
   }

   // ── Product Card ───────────────────────────────────────────────────────────
   /**
    * @param {Object} product - normalized product object
    * @param {string} product.id
    * @param {string} product.name
    * @param {string} product.price
    * @param {string} product.mainImage
    * @param {string} product.category
    * @param {Object} product.specs
    * @param {number} product.index
    */
   function productCard(product) {
      const { id, name, price, mainImage, category, specs, index } = product;
      const inCart = Store.isInCart(id);
      const inFav = Store.isFavorite(id);
      const inCmp = Store.inComparison(id);

      // Spec display keys by category
      const specMap = {
         laptop: ["Prosessor (CPU)", "Videokart (GFX)", "RAM", "SSD"],
         pc: ["Prosessor (CPU)", "Videokart (GFX)", "RAM", "SSD"],
         monitor: ["Ekran ölçüsü", "Görüntü imkanı", "Tezlik", "Panel növü"],
         component: ["P/N", "Qeyd"],
      };
      const keys = specMap[category] || [];

      const card = document.createElement("div");
      card.id = `card-${id}`;
      card.className = ["bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800", "rounded-xl overflow-hidden flex flex-col", "hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700", "transition-all duration-200 relative group"].join(" ");

      card.innerHTML = `
      <!-- Badges row -->
      <div class="absolute top-3 left-3 z-10 flex gap-1.5 pointer-events-none">
        ${Store.getDiscount(price) > 0 ? `<span class="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-${Store.getDiscount(price)}%</span>` : ""}
      </div>

      <!-- Favorite & Compare -->
      <div class="absolute top-3 right-3 z-10 flex flex-col gap-1.5
                  opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          data-action="favorite" data-id="${id}"
          aria-label="Sevimlilərə əlavə et"
          class="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700
                 hover:border-red-300 transition-colors fav-btn-${id}">
          <svg class="w-4 h-4 ${inFav ? "text-red-500 fill-red-500" : "text-gray-500 dark:text-gray-400"}"
               viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="${inFav ? "currentColor" : "none"}">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682
                 a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318
                 a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
        <button
          data-action="compare" data-id="${id}"
          aria-label="Müqayisəyə əlavə et"
          class="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700
                 hover:border-blue-300 transition-colors cmp-btn-${id}
                 ${inCmp ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : ""}">
          <svg class="w-4 h-4 ${inCmp ? "text-blue-500" : "text-gray-500 dark:text-gray-400"}"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2
                 a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0
                 a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14
                 a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </button>
      </div>

      <!-- Image -->
      <a href="product-detail.html?type=${category}&id=${index}"
         class="block bg-gray-50 dark:bg-gray-800/50 p-4 flex-shrink-0">
        <img
          src="${mainImage}"
          alt="${name}"
          loading="lazy"
          class="w-full h-44 object-contain mx-auto transition-transform duration-300 group-hover:scale-105"
          onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%239ca3af%22 font-size=%2212%22%3ENo Image%3C/text%3E%3C/svg%3E'">
      </a>

      <!-- Info -->
      <div class="p-4 flex flex-col flex-1 gap-2">
        <a href="product-detail.html?type=${category}&id=${index}"
           class="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug
                  hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          ${name}
        </a>

        ${priceHTML(price)}

        ${
           keys.length
              ? `
          <ul class="space-y-0.5 mt-1">
            ${specRows(specs, keys)}
          </ul>`
              : ""
        }

        <!-- Actions -->
        <div class="mt-auto pt-3 flex gap-2">
          <button
            data-action="cart" data-id="${id}"
            class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                   transition-colors duration-150 cart-btn-${id}
                   ${inCart ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}">
            <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 4h11"/>
            </svg>
            <span>${inCart ? "Səbətdə" : "Səbətə əlavə et"}</span>
          </button>
          <a href="product-detail.html?type=${category}&id=${index}"
             aria-label="Ətraflı bax"
             class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                    text-gray-600 dark:text-gray-400 hover:border-blue-400
                    hover:text-blue-600 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943
                   9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
          </a>
        </div>
      </div>`;

      // Event delegation on the card
      card.addEventListener("click", (e) => {
         const btn = e.target.closest("[data-action]");
         if (!btn) return;
         e.preventDefault();
         const action = btn.dataset.action;
         if (action === "cart") handleCartAction(product, btn);
         if (action === "favorite") handleFavoriteAction(product, btn);
         if (action === "compare") handleCompareAction(product, btn);
      });

      return card;
   }

   function handleCartAction(product, btn) {
      Store.addToCart(product);
      // Update all cart buttons for this product
      document.querySelectorAll(`[data-action="cart"][data-id="${product.id}"]`).forEach((b) => {
         b.classList.remove("bg-blue-600", "hover:bg-blue-700");
         b.classList.add("bg-emerald-600", "hover:bg-emerald-700");
         b.querySelector("span").textContent = "Səbətdə";
      });
   }

   function handleFavoriteAction(product, btn) {
      Store.toggleFavorite(product);
      const isFav = Store.isFavorite(product.id);
      document.querySelectorAll(`[data-action="favorite"][data-id="${product.id}"]`).forEach((b) => {
         const svg = b.querySelector("svg");
         if (isFav) {
            svg.classList.add("text-red-500", "fill-red-500");
            svg.setAttribute("fill", "currentColor");
         } else {
            svg.classList.remove("text-red-500", "fill-red-500");
            svg.setAttribute("fill", "none");
         }
      });
   }

   function handleCompareAction(product, btn) {
      Store.toggleCompare(product);
      const inCmp = Store.inComparison(product.id);
      document.querySelectorAll(`[data-action="compare"][data-id="${product.id}"]`).forEach((b) => {
         const svg = b.querySelector("svg");
         if (inCmp) {
            b.classList.add("border-blue-400", "bg-blue-50", "dark:bg-blue-900/20");
            svg.classList.add("text-blue-500");
         } else {
            b.classList.remove("border-blue-400", "bg-blue-50", "dark:bg-blue-900/20");
            svg.classList.remove("text-blue-500");
         }
      });
      renderCompareBar();
   }

   // ── Cart Sidebar ───────────────────────────────────────────────────────────
   function renderCartSidebar() {
      const sidebar = document.getElementById("cart-sidebar");
      const overlay = document.getElementById("cart-overlay");
      if (!sidebar) return;

      const cart = Store.cart;
      const total = Store.cartTotal();
      const count = Store.cartCount();

      // Update header badge
      document.querySelectorAll("[data-cart-count]").forEach((el) => {
         el.textContent = count;
         el.classList.toggle("hidden", count === 0);
      });

      sidebar.innerHTML = `
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 4h11m-9 4a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z"/>
          </svg>
          <h2 class="font-semibold text-gray-900 dark:text-white">Səbət</h2>
          ${count > 0 ? `<span class="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">${count}</span>` : ""}
        </div>
        <button onclick="Store.closeCart()" aria-label="Bağla"
          class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Items -->
      <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        ${
           cart.length === 0
              ? `
          <div class="flex flex-col items-center justify-center py-16 text-center gap-3">
            <svg class="w-12 h-12 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 4h11"/>
            </svg>
            <p class="text-sm text-gray-500 dark:text-gray-400">Səbət boşdur</p>
          </div>
        `
              : cart
                   .map(
                      (item) => `
          <div class="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <img src="${item.mainImage || item.image || ""}" alt="${item.name}"
                 class="w-14 h-14 object-contain bg-white dark:bg-gray-900 rounded-lg shrink-0 p-1"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2256%22 height=%2256%22%3E%3Crect fill=%22%23f3f4f6%22 width=%2256%22 height=%2256%22/%3E%3C/svg%3E'">
            <div class="flex-1 min-w-0 flex flex-col gap-1.5">
              <p class="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">${item.name}</p>
              <p class="text-sm font-bold text-emerald-600 dark:text-emerald-400">${Store.parsePrice(item.price)}₼</p>
              <div class="flex items-center gap-2">
                <div class="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button onclick="Store.updateQty('${item.id}', ${(item.qty || 1) - 1})"
                    class="px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm leading-none">−</button>
                  <span class="px-2.5 py-1 text-sm font-medium text-gray-900 dark:text-white border-x border-gray-200 dark:border-gray-700">${item.qty || 1}</span>
                  <button onclick="Store.updateQty('${item.id}', ${(item.qty || 1) + 1})"
                    class="px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm leading-none">+</button>
                </div>
                <button onclick="Store.removeFromCart('${item.id}')"
                  class="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>`,
                   )
                   .join("")
        }
      </div>

      <!-- Footer -->
      ${
         cart.length > 0
            ? `
        <div class="px-4 py-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Cəmi</span>
            <span class="text-lg font-bold text-gray-900 dark:text-white">${total}₼</span>
          </div>
          <a href="cart.html"
            class="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold
                   py-3 rounded-xl transition-colors text-sm">
            Sifarişi tərtib et
          </a>
          <button onclick="Store.clearCart()"
            class="block w-full text-center text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors py-1">
            Səbəti təmizlə
          </button>
        </div>`
            : ""
      }`;

      // Subscribe for rerenders
      const isOpen = Store.cartOpen;
      sidebar.classList.toggle("translate-x-full", !isOpen);
      if (overlay) {
         overlay.classList.toggle("opacity-0", !isOpen);
         overlay.classList.toggle("pointer-events-none", !isOpen);
      }
   }

   // ── Compare Bar ────────────────────────────────────────────────────────────
   function renderCompareBar() {
      let bar = document.getElementById("compare-bar");
      const items = Store.comparison;

      if (!bar) {
         bar = document.createElement("div");
         bar.id = "compare-bar";
         document.body.appendChild(bar);
      }

      if (items.length === 0) {
         bar.className = "hidden";
         return;
      }

      bar.className = ["fixed bottom-0 left-0 right-0 z-40", "bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl", "px-4 py-3 flex items-center gap-3 overflow-x-auto"].join(" ");

      bar.innerHTML = `
      <span class="text-xs font-semibold text-gray-600 dark:text-gray-400 shrink-0">Müqayisə (${items.length}/4):</span>
      <div class="flex gap-2 flex-1 overflow-x-auto">
        ${items
           .map(
              (p) => `
          <div class="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 shrink-0">
            <img src="${p.mainImage || p.image}" class="w-8 h-8 object-contain" alt="${p.name}">
            <span class="text-xs text-gray-700 dark:text-gray-300 max-w-[100px] truncate">${p.name}</span>
            <button onclick="Store.toggleCompare({id:'${p.id}'}); UI.renderCompareBar();"
              class="text-gray-400 hover:text-red-500 transition-colors ml-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>`,
           )
           .join("")}
      </div>
      ${
         items.length >= 2
            ? `
        <a href="compare.html" class="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
          Müqayisə et
        </a>`
            : ""
      }
      <button onclick="Store.clearComparison(); UI.renderCompareBar();"
        class="shrink-0 text-xs text-gray-500 hover:text-red-500 transition-colors px-2">Sil</button>`;
   }

   // ── Toast Notifications ────────────────────────────────────────────────────
   function initToasts() {
      if (document.getElementById("toast-container")) return;
      const container = document.createElement("div");
      container.id = "toast-container";
      container.className = "fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none";
      document.body.appendChild(container);

      Store.on("toast", ({ type, msg }) => {
         const colors = {
            success: "bg-emerald-600 text-white",
            info: "bg-blue-600 text-white",
            warning: "bg-amber-500 text-white",
            error: "bg-red-600 text-white",
         };
         const toast = document.createElement("div");
         toast.className = ["pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg", "text-sm font-medium min-w-[200px] max-w-[320px]", colors[type] || colors.info, "translate-x-full opacity-0 transition-all duration-300"].join(" ");
         toast.textContent = msg;
         container.appendChild(toast);
         // Animate in
         requestAnimationFrame(() => {
            toast.classList.remove("translate-x-full", "opacity-0");
         });
         // Auto-remove
         setTimeout(() => {
            toast.classList.add("translate-x-full", "opacity-0");
            setTimeout(() => toast.remove(), 350);
         }, 2800);
      });
   }

   // ── Loading Skeleton ───────────────────────────────────────────────────────
   function skeletonCard() {
      return `<div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden animate-pulse">
      <div class="bg-gray-200 dark:bg-gray-800 h-44 w-full"></div>
      <div class="p-4 space-y-3">
        <div class="h-3.5 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
        <div class="h-3.5 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
        <div class="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
        <div class="h-9 bg-gray-200 dark:bg-gray-800 rounded-lg w-full mt-2"></div>
      </div>
    </div>`;
   }

   function showSkeletons(containerId, count = 8) {
      const el = document.getElementById(containerId);
      if (!el) return;
      el.innerHTML = Array(count).fill(skeletonCard()).join("");
   }

   // ── Empty State ────────────────────────────────────────────────────────────
   function emptyState(msg = "Məhsul tapılmadı") {
      return `<div class="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-center">
      <svg class="w-14 h-14 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p class="text-sm text-gray-500 dark:text-gray-400">${msg}</p>
    </div>`;
   }

   // ── Dark Mode ──────────────────────────────────────────────────────────────
   function initDarkMode() {
      const stored = localStorage.getItem("aztech_theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (stored === "dark" || (!stored && prefersDark)) {
         document.documentElement.classList.add("dark");
      }
   }

   function toggleDarkMode() {
      const isDark = document.documentElement.classList.toggle("dark");
      localStorage.setItem("aztech_theme", isDark ? "dark" : "light");
      document.querySelectorAll("[data-theme-icon]").forEach((el) => {
         el.innerHTML = isDark ? moonIcon() : sunIcon();
      });
   }

   function sunIcon() {
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707
           M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
    </svg>`;
   }

   function moonIcon() {
      return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
    </svg>`;
   }

   // ── Public ─────────────────────────────────────────────────────────────────
   return {
      priceHTML,
      productCard,
      renderCartSidebar,
      renderCompareBar,
      initToasts,
      showSkeletons,
      emptyState,
      initDarkMode,
      toggleDarkMode,
      sunIcon,
      moonIcon,
   };
})();
