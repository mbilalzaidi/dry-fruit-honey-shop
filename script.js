const products = [
  {
    id: "almond-bliss",
    name: "Almond Bliss",
    detail: "California almonds · 200g",
    price: 12,
    category: "Nuts",
    badge: "Bestseller",
    image: "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "golden-hour",
    name: "Golden Hour Honey",
    detail: "Wildflower honey · 250g",
    price: 16,
    category: "Honey",
    badge: "Small batch",
    image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "berry-good",
    name: "Berry Good Mix",
    detail: "Berries & toasted nuts · 180g",
    price: 14,
    category: "Nuts",
    badge: "Customer favorite",
    image: "https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "pistachio-dream",
    name: "Pistachio Dream",
    detail: "Roasted pistachios · 180g",
    price: 15,
    category: "Nuts",
    badge: "",
    image: "https://images.unsplash.com/photo-1523114340113-07dd4f6e1d7e?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "honey-comb",
    name: "Honeycomb Love",
    detail: "Raw honeycomb · 200g",
    price: 19,
    category: "Honey",
    badge: "Raw & real",
    image: "https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "morning-ritual",
    name: "Morning Ritual",
    detail: "A little bit of everything · 3-pack",
    price: 34,
    category: "Bundles",
    badge: "Gift-ready",
    image: "https://images.unsplash.com/photo-1608797178974-15b35a64ede9?auto=format&fit=crop&w=800&q=80",
  },
];

const productGrid = document.querySelector("#product-grid");
const cartDrawer = document.querySelector("#cart-drawer");
const cartOverlay = document.querySelector("#cart-overlay");
const cartItems = document.querySelector("#cart-items");
const cartEmpty = document.querySelector("#cart-empty");
const cartFooter = document.querySelector("#cart-footer");
const cartCount = document.querySelector("#cart-count");
const drawerCount = document.querySelector("#drawer-count");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#search-input");
const sortSelect = document.querySelector("#sort-select");
const toast = document.querySelector("#toast");
const FREE_SHIPPING = 50;

let activeCategory = "All";
let cart = loadCart();
let toastTimeout;

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("nut-nectar-cart") || "{}");
    return Object.fromEntries(
      Object.entries(saved).filter(([id, quantity]) =>
        products.some((product) => product.id === id) &&
        Number.isInteger(quantity) &&
        quantity > 0,
      ),
    );
  } catch {
    return {};
  }
}

function saveCart() {
  localStorage.setItem("nut-nectar-cart", JSON.stringify(cart));
}

function formatPrice(price) {
  return `$${price.toFixed(2)}`;
}

function renderProducts() {
  const search = searchInput.value.trim().toLowerCase();
  let visibleProducts = products.filter((product) => {
    const categoryMatches = activeCategory === "All" || product.category === activeCategory;
    const searchMatches = `${product.name} ${product.detail} ${product.category}`.toLowerCase().includes(search);
    return categoryMatches && searchMatches;
  });

  if (sortSelect.value === "price-low") visibleProducts = [...visibleProducts].sort((a, b) => a.price - b.price);
  if (sortSelect.value === "price-high") visibleProducts = [...visibleProducts].sort((a, b) => b.price - a.price);

  productGrid.innerHTML = visibleProducts.map((product) => `
    <article class="product-card">
      <div class="product-image-wrap">
        <img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy" />
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
        <button class="quick-add" data-add="${product.id}" aria-label="Add ${product.name} to bag">+</button>
      </div>
      <div class="product-info">
        <div><h3 class="product-name">${product.name}</h3><p class="product-detail">${product.detail}</p></div>
        <p class="product-price">${formatPrice(product.price)}</p>
      </div>
    </article>
  `).join("");
  emptyState.hidden = visibleProducts.length > 0;
}

function cartQuantity() {
  return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
}

function cartTotal() {
  return Object.entries(cart).reduce((sum, [id, quantity]) => {
    const product = products.find((item) => item.id === id);
    return sum + product.price * quantity;
  }, 0);
}

function renderCart() {
  const quantity = cartQuantity();
  const subtotal = cartTotal();
  cartCount.textContent = quantity;
  drawerCount.textContent = `(${quantity})`;
  cartDrawer.classList.toggle("is-empty", quantity === 0);
  cartItems.innerHTML = Object.entries(cart).map(([id, count]) => {
    const product = products.find((item) => item.id === id);
    return `
      <article class="cart-row">
        <img src="${product.image}" alt="" />
        <div>
          <h3>${product.name}</h3><small>${product.detail}</small>
          <div class="quantity-control">
            <button data-quantity="${id}" data-change="-1" aria-label="Remove one ${product.name}">−</button>
            <span>${count}</span>
            <button data-quantity="${id}" data-change="1" aria-label="Add one ${product.name}">+</button>
          </div>
        </div>
        <span class="cart-row-price">${formatPrice(product.price * count)}</span>
      </article>
    `;
  }).join("");
  cartEmpty.hidden = quantity > 0;
  cartFooter.hidden = quantity === 0;
  document.querySelector("#cart-subtotal").textContent = formatPrice(subtotal);
  const remaining = FREE_SHIPPING - subtotal;
  document.querySelector("#shipping-note").textContent = remaining > 0
    ? `You're ${formatPrice(remaining)} away from free shipping`
    : "You unlocked free shipping — lovely choice!";
}

function addToCart(id) {
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  showToast(`${products.find((product) => product.id === id).name} added to your bag`);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2200);
}

function openCart() {
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  cartOverlay.hidden = false;
  document.body.classList.add("cart-open");
  document.querySelector("#close-cart").focus();
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  cartOverlay.hidden = true;
  document.body.classList.remove("cart-open");
  document.querySelector("#open-cart").focus();
}

document.querySelector("#shop").addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  if (addButton) addToCart(addButton.dataset.add);
});

cartItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-quantity]");
  if (!button) return;
  const id = button.dataset.quantity;
  cart[id] += Number(button.dataset.change);
  if (cart[id] <= 0) delete cart[id];
  saveCart();
  renderCart();
});

document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip === button));
    renderProducts();
  });
});

document.querySelectorAll("[data-nav-category]").forEach((link) => {
  link.addEventListener("click", () => {
    activeCategory = link.dataset.navCategory;
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.category === activeCategory));
    renderProducts();
  });
});

document.querySelector("#view-all").addEventListener("click", () => {
  activeCategory = "All";
  searchInput.value = "";
  document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.category === "All"));
  renderProducts();
});

searchInput.addEventListener("input", renderProducts);
sortSelect.addEventListener("change", renderProducts);
document.querySelector("#open-cart").addEventListener("click", openCart);
document.querySelector("#close-cart").addEventListener("click", closeCart);
document.querySelector("#continue-shopping").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cartDrawer.classList.contains("is-open")) closeCart();
});

document.querySelector("#checkout-button").addEventListener("click", () => {
  showToast("Checkout is coming soon — your bag is saved!");
});

document.querySelector("#newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#newsletter-message").textContent = "Newsletter signup is not connected yet.";
});

renderProducts();
renderCart();
