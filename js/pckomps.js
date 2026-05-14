async function getPCs() {
   try {
      const res = await fetch("https://corepcdata.onrender.com/pcomps");
      const pcs = await res.json();

      const container = document.getElementById("personal-comps");

      // Load favorites and cart from localStorage
      const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
      const cart = JSON.parse(localStorage.getItem('cart')) || [];

      pcs.forEach((pc, index) => {
         const card = document.createElement("div");
         card.className = "bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all relative group";

         // fiyat (tek fiyat veya indirimli-indirimsiz kontrolü)
         const prices = pc.price.replace(/\s+/g, "").match(/(\d+₼)/g);
         let discounted = "";
         let original = "";

         if (prices && prices.length > 1) {
            discounted = prices[0]; // indirimli fiyat
            original = prices[1];   // indirimsiz fiyat
         } else if (prices && prices.length === 1) {
            discounted = prices[0]; // sadece tek fiyat
         }

         let priceHTML = "";
         if (discounted && original) {
            priceHTML = `
               <div class="mb-3 flex items-center gap-2">
                  <span class="text-green-600 dark:text-green-400 font-bold text-xl">${discounted}</span>
                  <span class="text-gray-500 dark:text-gray-400 line-through">${original}</span>
               </div>`;
         } else if (discounted) {
            priceHTML = `
               <div class="mb-3">
                  <span class="text-green-600 dark:text-green-400 font-bold text-xl">${discounted}</span>
               </div>`;
         }

         // Check if product is in favorites
         const productKey = `pc-${index}`;
         const isFavorite = favorites.some(fav => fav.id === productKey);
         const isInCart = cart.some(item => item.id === productKey);

         card.innerHTML = `
          <!-- Favorite Button -->
          <button onclick="toggleFavorite('${productKey}', '${pc.name.replace(/'/g, "\\'")}', '${pc.mainImage}', '${discounted}', 'pc', ${index})" 
                  class="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 transition-all shadow-lg opacity-0 group-hover:opacity-100">
            <svg class="w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600 dark:text-gray-400'}" 
                 fill="${isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          </button>

          <a href="product-detail.html?type=pc&id=${index}" class="block">
            <img src="${pc.mainImage}" alt="${pc.name}" class="w-full h-56 object-contain bg-gray-100 dark:bg-gray-700 p-4">
          </a>
          <div class="p-4">
            <h2 class="text-lg font-semibold mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">${pc.name}</h2>
            ${priceHTML}
            <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-4">
              <li><b>CPU:</b> ${pc.specs["Prosessor (CPU)"] || "-"}</li>
              <li><b>GPU:</b> ${pc.specs["Videokart (GFX)"] || "-"}</li>
              <li><b>RAM:</b> ${pc.specs["RAM"] || "-"}</li>
              <li><b>SSD:</b> ${pc.specs["SSD"] || "-"}</li>
            </ul>
            
            <!-- Action Buttons -->
            <div class="flex space-x-2">
              <button onclick="addToCart('${productKey}', '${pc.name.replace(/'/g, "\\'")}', '${pc.mainImage}', '${discounted}', 'pc', ${index})"
                      class="flex-1 px-4 py-2 ${isInCart ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors flex items-center justify-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5"></path>
                </svg>
                <span class="text-sm">${isInCart ? 'Səbətdə' : 'Səbətə əlavə et'}</span>
              </button>
              <a href="product-detail.html?type=pc&id=${index}" 
                 class="px-3 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
              </a>
            </div>
          </div>
        `;

         container.appendChild(card);
      });
   } catch (err) {
      console.error("API fetch error:", err);
      document.getElementById("personal-comps").innerHTML = "<p class='text-red-500 dark:text-red-400'>Veriler yüklenemedi.</p>";
   }
}

// Favorite functionality
function toggleFavorite(productKey, name, image, price, type, index) {
   let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
   const existingIndex = favorites.findIndex(fav => fav.id === productKey);
   
   if (existingIndex > -1) {
      favorites.splice(existingIndex, 1);
   } else {
      const favoriteItem = {
         id: productKey,
         name: name,
         image: image,
         price: price,
         type: type,
         index: index
      };
      favorites.push(favoriteItem);
   }
   
   localStorage.setItem('favorites', JSON.stringify(favorites));
   
   // Update heart icon
   const heartIcon = event.target.closest('button').querySelector('svg');
   const isFavorite = favorites.some(fav => fav.id === productKey);
   
   if (isFavorite) {
      heartIcon.classList.add('text-red-500', 'fill-current');
      heartIcon.classList.remove('text-gray-600', 'dark:text-gray-400');
      heartIcon.setAttribute('fill', 'currentColor');
   } else {
      heartIcon.classList.remove('text-red-500', 'fill-current');
      heartIcon.classList.add('text-gray-600', 'dark:text-gray-400');
      heartIcon.setAttribute('fill', 'none');
   }
}

// Cart functionality
function addToCart(productKey, name, image, price, type, index) {
   let cart = JSON.parse(localStorage.getItem('cart')) || [];
   const existingItem = cart.find(item => item.id === productKey);
   
   if (!existingItem) {
      const cartItem = {
         id: productKey,
         name: name,
         image: image,
         price: price,
         type: type,
         index: index
      };
      cart.push(cartItem);
      localStorage.setItem('cart', JSON.stringify(cart));
      
      // Update cart count if function exists
      if (typeof updateCartCount === 'function') {
         updateCartCount();
      } else {
         // Update cart count in header
         const cartCount = document.querySelector('#shoppingCartBtn span');
         if (cartCount) {
            cartCount.textContent = cart.length;
         }
      }
      
      // Update button appearance
      const button = event.target.closest('button');
      button.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      button.classList.add('bg-green-600', 'hover:bg-green-700');
      button.querySelector('span').textContent = 'Səbətdə';
   }
}

getPCs();