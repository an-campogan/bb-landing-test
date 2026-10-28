let categories = []
let products = []

let currentUser = {
    name: "",
    email: "",
    phone: "",
    address: ""
}
let recentlyViewed = []
let filteredProducts = []
let cart = []
let orders = []
let currentOrderSteps = 1;

async function loadData(){
    try {
        const response = await fetch("data.json")
        if(!response.ok){
            throw new Error("Failed to load data")
        }
        const data = await response.json()
        categories = data.categories
        products = data.products

        initializeApp()
    } catch (error) {
        console.error("Error loading data:", error)
        document.body.innerHTML = '<div style="text-align:center; margin-top: 50px;"><h2>Error loading data. Please refresh the page.</h2></div>'
    }
}

function initializeApp(){
    renderCategories();
    showPage("home");
}

document.addEventListener("DOMContentLoaded", function(){
    loadData()
})

function showPage(pageId){
    const pages = document.querySelectorAll(".page")
    pages.forEach(page => page.classList.add("hidden"))

    const targetPage = document.getElementById(pageId + "Page")
    if(targetPage){
        targetPage.classList.remove("hidden")
    }

    switch(pageId){
        case "home":
            renderCategories();
            break;
        case "cart":
            renderCart();
            break;
        case "orders":
            renderOrders();
            break;
        case "account":
            loadUserAccountPage();
            break;
    }
}

function renderCategories(){
    const categoryGrid = document.getElementById("categoryGrid")
    categoryGrid.innerHTML = "";

    categories.forEach(category =>{
        const categoryCard = document.createElement("div");
        categoryCard.className = "category-card";
        categoryCard.onclick = () => showCategory(category.id);

        let cardContent = `
            <img src="${category.image}" alt="${category.name}">
            <div class="category-card-content">
            <h3>${category.name}</h3>
            <p>${category.description}</p>
        `;

        if(category.isRecentlyViewed){
            if(recentlyViewed.length === 0){
                cardContent += '<p><em>No recently viewed products</em></p>'
            } else {
                cardContent += `<p> You have ${recentlyViewed.length} recently viewed items</p>`
            }
        }
        cardContent += `
            <a href="#" class="category-btn">View Products</a>
            </div>
        `;
        categoryCard.innerHTML = cardContent;
        categoryGrid.appendChild(categoryCard)
    })
}

function showCategory(categoryId){
    if (categoryId === "recently-viewed") {
        filteredProducts = products.filter(product => recentlyViewed.includes(product.id))
        document.getElementById("categoryTitle").textContent = "Recently Viewed Products"
    } else {
        filteredProducts = products.filter(product => product.category === categoryId)
        const category = categories.find(cat => cat.id === categoryId)
        document.getElementById("categoryTitle").textContent = category ? category.name : "Products"
    }
    populateFilters();
    renderProducts();
    showPage("category");
}

function populateFilters(){
    const brandFilter = document.getElementById("brandFilter")
    const brands = [...new Set(filteredProducts.map(product => product.brand))]

    brandFilter.innerHTML = '<option value="">All Brands</option>';
    brands.forEach(brand=>{
        const option = document.createElement("option")
        option.value = brand;
        option.textContent = brand;
        brandFilter.appendChild(option)
    })
}

function applyFilters() {
    const sortBy = document.getElementById("sortBy").value;
    const maxPrice = parseInt(document.getElementById("priceRange").value);
    const selectedBrand = document.getElementById("brandFilter").value;

    let filtered = filteredProducts.filter(product => {
        if (product.price > maxPrice) return false;
        if (selectedBrand && product.brand !== selectedBrand) return false;
        return true;
    });

    switch (sortBy) {
        case "price-low":
            filtered.sort((a, b) => a.price - b.price);
            break;
        case "price-high":
            filtered.sort((a, b) => b.price - a.price);
            break;
        case "rating":
            filtered.sort((a, b) => b.rating - a.rating);
            break;
        default:
            break;
    }

    renderProducts(filtered);
}

function renderProducts(productsToRender = filteredProducts){
    const productGrid = document.getElementById("productGrid")
    productGrid.innerHTML = "";

    if (productsToRender.length === 0){
        productGrid.innerHTML = '<p>No products found matching your criteria.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const productCard = document.createElement("div");
        productCard.className = "product-card";
        productCard.onclick = () => showProduct(product.id)

        const ratingStars = "★".repeat(Math.floor(product.rating)) + "☆".repeat(5 - Math.floor(product.rating));

        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div class="product-card-content">
                <div class="product-brand">${product.brand}</div>
                <h3>${product.name}</h3>
                <div class="product-rating">
                    ${ratingStars} ${product.rating}
                </div>
                <div class="product-price">
                    <span class="current-price">₱${product.price}</span>
                    <span class="original-price">₱${product.originalPrice}</span>
                    <span class="discount">${product.discount}% OFF</span>
                </div>
            </div>
        `;

        productGrid.appendChild(productCard);
    });
}

function showProduct(productId){
    const product = products.find(p => p.id === productId);
    if(!product) return;

    showPage("productDetails");

    if(!recentlyViewed.includes(productId)){
        recentlyViewed.unshift(productId);
        if(recentlyViewed.length > 10){
            recentlyViewed.pop();
        }
        saveRecentlyViewed();
    }

    const productDetail = document.getElementById("productDetails");
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    const ratingStars = "★".repeat(Math.floor(product.rating)) + "☆".repeat(5 - Math.floor(product.rating));

    productDetail.innerHTML = `
        <div>
            <img src="${product.image}" alt="${product.name}" class="product-image">
        </div>
        <div class="product-info">
            <h1>${product.name}</h1>
            <div class="brand">${product.brand}</div>
            <div class="product-rating">
                ${ratingStars} ${product.rating}
            </div>
            <div class="product-price">
                <span class="current-price">₱${product.price}</span>
                <span class="original-price">₱${product.originalPrice}</span>
                <span class="discount">${product.discount}% OFF</span>
            </div>
            <div class="description">${product.description}</div>
            
            <div class="product-option">
                ${product.colors && product.colors.length > 0 ? `
                <div class="option-group">
                    <label>Color:</label>
                    <select id="selectedColor">
                        ${product.colors.map(color => `
                            <option value="${color}">${color}</option>
                        `).join("")}
                    </select>
                </div>
                ` : ""}
                
                ${product.sizes && product.sizes.length > 0 ? `
                <div class="option-group">
                    <label>Size:</label>
                    <select id="selectedSize">
                        ${product.sizes.map(size => `
                            <option value="${size}">${size}</option>
                        `).join("")}
                    </select>
                </div>
                ` : ""}
            </div>
             
            <div class="address-section">
                <h3>Delivery Address</h3>
                ${currentUser.address ? `
                    <p>${currentUser.address}</p>
                    <button class="btn-secondary" onclick="showPage('account')">Change Address</button>
                ` : `
                    <p>No address added</p>
                    <button class="btn-secondary" onclick="showPage('account')">Add Address</button>
                `}
            </div>
            
            <div class="delivery-info">
                <h4>Delivery Information</h4>
                <p>📅 Delivery by ${deliveryDate.toLocaleDateString()}</p>
                <p>🔄 10 days return policy</p>
                <p>💰 Cash on delivery available</p>
            </div>

            <div class="product-actions">
                <button class="btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
                <button class="btn-secondary" onclick="buyNow(${product.id})">Buy Now</button>
            </div>
        </div>
    `;
}

function buyNow(productId){
    addToCart(productId);
    showPage("cart")
}

function showToast(product) {
    const toast = document.getElementById("cartToast");
    const toastImg = document.getElementById("toastImg");
    const toastTitle = document.getElementById("toastTitle");

    if(!toast) return;

    toastImg.src = product.image;
    toastTitle.textContent = product.name;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function addToCart(productId){
    const product = products.find(p => p.id === productId);
    if(!product) return;

    const selectedColor = document.getElementById("selectedColor")?.value || "";
    const selectedSize = document.getElementById("selectedSize")?.value || "";

    const existingItem = cart.find(item =>
        item.id === productId &&
        item.color === selectedColor &&
        item.size === selectedSize
    );

    if (existingItem){
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            brand: product.brand,
            price: product.price,
            originalPrice: product.originalPrice,
            discount: product.discount,
            image: product.image,
            color: selectedColor,
            size: selectedSize,
            quantity: 1
        });
    }
    updateCartCount();
    saveCartData();
    showToast(product);
}

function buyNow(productId){
    addToCart(productId);
    showPage('cart');
}

function renderCart(){
    const cartItems = document.getElementById("cartItems");
    const cartSummary = document.getElementById("cartSummary");

    if(!cartItems || !cartSummary) return;

    if(cart.length === 0 ){
        cartItems.innerHTML = '<p>Your cart is empty. <a href="#" onclick="showPage(\'home\')">Continue Shopping</a></p>';
        cartSummary.innerHTML = '';
        return;
    }

    cartItems.innerHTML = '';
    let totalOriginal = 0;
    let totalDiscounted = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        const itemOriginalTotal = item.originalPrice * item.quantity;
        totalOriginal += itemOriginalTotal;
        totalDiscounted += itemTotal;

        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
            <div class="cart-item-details" style="flex: 1;">
                <h3>${item.name}</h3>
                <div class="product-brand">${item.brand}</div>
                ${item.color ? `<p>Color: ${item.color}</p>` : ""}
                ${item.size ? `<p>Size: ${item.size}</p>` : ""}
                <div class="product-price">
                    <span class="current-price">₱${item.price}</span>
                    <span class="original-price">₱${item.originalPrice}</span>
                    <span class="discount">${item.discount}% OFF</span>
                </div>
                <div class="quantity-controls" style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" style="width: 50px; text-align: center;" onchange="updateQuantity(${index}, 0, this.value)">
                    <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                </div>
                <p><strong>Total: ₱${itemTotal}</strong></p>
            </div>
            <button class="btn-secondary" onclick="removeFromCart(${index})">Remove</button>
        `;
        cartItems.appendChild(cartItem);
    });

    const deliveryCharges = totalDiscounted > 500 ? 0 : 50;
    const finalTotal = totalDiscounted + deliveryCharges;

    cartSummary.innerHTML = `
        <h3>Price Details</h3>
        <div class="summary-row" style="display: flex; justify-content: space-between; margin: 8px 0;">
            <span>Total MRP:</span>
            <span>₱${totalOriginal}</span>
        </div>
        <div class="summary-row" style="display: flex; justify-content: space-between; margin: 8px 0;">
            <span>Discount:</span>
            <span>-₱${totalOriginal - totalDiscounted}</span>
        </div>
        <div class="summary-row" style="display: flex; justify-content: space-between; margin: 8px 0;">
            <span>Delivery Charges:</span>
            <span>${deliveryCharges === 0 ? "FREE" : "₱" + deliveryCharges}</span>
        </div>
        <div class="summary-divider" style="border-top: 1px solid #ddd; margin: 12px 0;"></div>
        <div class="summary-row summary-total" style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1rem; margin: 8px 0;">
            <span>Total Amount:</span>
            <span>₱${finalTotal}</span>
        </div>
        <button class="btn-primary" onclick="proceedToCheckout()" style="width:100%; margin-top:20px;">
            Place Order
        </button>
    `;
}

function updateQuantity(index, change, newValue = null){
    if(newValue !== null){
        cart[index].quantity = Math.max(1, parseInt(newValue) || 1);
    } else {
        cart[index].quantity = Math.max(1, cart[index].quantity + change);
    }

    updateCartCount();
    saveCartData();
    renderCart();
}

function removeFromCart(index){
    cart.splice(index, 1);
    updateCartCount();
    saveCartData();
    renderCart();
}

function proceedToCheckout(){
    currentOrderSteps = 1;
    showPage('order');
}

function updateCartCount() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountEl = document.getElementById("cartCount");
    if(cartCountEl) {
        cartCountEl.textContent = `(${cartCount})`;
    }
}

function saveCartData(){
    try{
        window.cartData = cart;
    } catch(e){
        console.log("Storage not available.");
    }
}

function saveRecentlyViewed(){
    try{
        window.recentlyViewedData = recentlyViewed;
    } catch(e){
        console.log("Storage not available.");
    }
}