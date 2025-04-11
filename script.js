// script.js
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navRight = document.querySelector('.nav-right');
    const cartIcon = document.getElementById('cart-icon');
    const cartSlider = document.getElementById('cart-slider');
    const closeCart = document.getElementById('close-cart');

    // Toggle hamburger menu
    hamburger.addEventListener('click', () => {
        navRight.classList.toggle('active');
        hamburger.textContent = navRight.classList.contains('active') ? '✕' : '☰';
    });

    // Toggle cart slider
    cartIcon.addEventListener('click', () => {
        cartSlider.classList.toggle('open');
    });

    closeCart.addEventListener('click', () => {
        cartSlider.classList.remove('open');
    });

    // Close navigation and cart on resize if needed
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navRight.classList.contains('active')) {
            navRight.classList.remove('active');
            hamburger.textContent = '☰';
        }
    });
});

function closePopup() {
    document.querySelector('.popup').style.display = 'none';
}