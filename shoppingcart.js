
const cartIcon = document.getElementById("cart-icon");
const cartSlider = document.getElementById("cart-slider");
const closeCart = document.getElementById("close-cart");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartCount = document.getElementById("cart-count");

let cart = [];

// Open cart slider
cartIcon.addEventListener("click", (e) => {
    e.preventDefault();
    cartSlider.classList.add("open");
});

// Close cart slider
closeCart.addEventListener("click", () => {
    cartSlider.classList.remove("open");
});

// Add to cart functionality
const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");
addToCartButtons.forEach(button => {
    button.addEventListener("click", () => {
        const itemName = button.getAttribute("data-name");
        const itemPrice = parseFloat(button.getAttribute("data-price"));

        const existingItem = cart.find(item => item.name === itemName);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ name: itemName, price: itemPrice, quantity: 1 });
        }
        updateCart();
    });
});

// Update cart UI
function updateCart() {
    cartItemsContainer.innerHTML = "";
    let total = 0;
    let count = 0;
    cart.forEach(item => {
        total += item.price * item.quantity;
        count += item.quantity;

        const cartItem = document.createElement("div");
        cartItem.innerHTML = `${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`;
        cartItemsContainer.appendChild(cartItem);
    });
    cartTotal.textContent = total.toFixed(2);
    cartCount.textContent = `🛒 (${count})`;
}
