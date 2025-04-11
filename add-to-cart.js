// add-to-cart.js

// Global variables
let cartData = JSON.parse(localStorage.getItem('cartData')) || [];
let appliedDiscount = 0;
let currentMethod = 'pickup';
const TAX_RATE = 0.08;
const DELIVERY_FEE = 5.00;
const promoCodes = {
    "SAVE10": 0.10,
    "BIGSAVE": 20.00
};
let map, marker, geocoder;

// Google Maps Embed API key (same as your JS API key)
const GOOGLE_MAPS_API_KEY = 'AIzaSyAY2FljZCto-nKWVgZxyh9kYSoCS0b_o1U';

// Move initMap to global scope
window.initMap = function() {
    const addressMapElement = document.getElementById('address-map');
    if (addressMapElement) {
        const mapOptions = {
            center: { lat: 39.9526, lng: -75.1652 }, // Default: Philadelphia, PA
            zoom: 12
        };
        map = new google.maps.Map(addressMapElement, mapOptions);
        marker = new google.maps.marker.AdvancedMarkerElement({
            map: map,
            position: mapOptions.center,
            draggable: true
        });
        geocoder = new google.maps.Geocoder();

        // Add click event to select address
        map.addListener('click', (event) => {
            const latLng = event.latLng;
            marker.position = latLng;
            updateAddressFromLatLng(latLng);
        });

        // Add dragend event for draggable marker
        marker.addListener('dragend', (event) => {
            const latLng = event.latLng;
            updateAddressFromLatLng(latLng);
        });
    }
};

const branchLocations = {
    dreamwood: {
        name: "Plantopia Dreamwood",
        address: "123 Dreamwood St, San Francisco, CA 94102",
        mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.019735215174!2d-122.419415684681!3d37.774929779759!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085808f8e2e3b1b%3A0x2e2e3b1b8e2e3b1b!2sSan%20Francisco%2C%20CA%2C%20USA!5e0!3m2!1sen!2sin!4v1630000000000!5m2!1sen!2sin"
    },
    heavengarden: {
        name: "Plantopia Heavengarden",
        address: "456 Heaven Ave, Los Angeles, CA 90001",
        mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3329.031057233543!2d-118.243684884623!3d34.052235980601!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2c75ddc27da13%3A0xe22fdf6f254608f4!2sLos%20Angeles%2C%20CA%2C%20USA!5e0!3m2!1sen!2sin!4v1630000000000!5m2!1sen!2sin"
        
    }
};

// Helper functions
function updateSummary(subtotal) {
    const summaryElements = {
        subtotal: document.getElementById('subtotal'),
        tax: document.getElementById('tax'),
        deliveryFee: document.getElementById('delivery-fee'),
        discount: document.getElementById('discount'),
        total: document.getElementById('total'),
        amountDue: document.getElementById('amount-due')
    };
    
    if (!Object.values(summaryElements).every(el => el)) return;

    const tax = subtotal * TAX_RATE;
    const total = currentMethod === 'delivery' ? 
        subtotal + tax + DELIVERY_FEE - appliedDiscount : 
        subtotal + tax - appliedDiscount;

    summaryElements.subtotal.textContent = `$${subtotal.toFixed(2)}`;
    summaryElements.tax.textContent = `$${tax.toFixed(2)}`;
    summaryElements.deliveryFee.textContent = currentMethod === 'delivery' ? 
        `$${DELIVERY_FEE.toFixed(2)}` : '$0.00';
    summaryElements.discount.textContent = `$${appliedDiscount.toFixed(2)}`;
    summaryElements.total.textContent = `$${total.toFixed(2)}`;
    summaryElements.amountDue.textContent = `$${total.toFixed(2)}`;
}

function updateRemoveListeners() {
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemName = e.target.getAttribute('data-name');
            const itemIndex = cartData.findIndex(item => item.name === itemName);
            if (itemIndex >= 0) {
                cartData[itemIndex].quantity--;
                if (cartData[itemIndex].quantity <= 0) cartData.splice(itemIndex, 1);
                saveCartToLocalStorage();
                showNotification(`${itemName} removed from cart`);
                updateCartSlider();
                updateCheckoutPage();
                updateCartCount();
            }
        });
    });
}

function updateQuantityListeners() {
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemName = e.target.getAttribute('data-name');
            const itemIndex = cartData.findIndex(item => item.name === itemName);
            if (itemIndex >= 0) {
                if (e.target.classList.contains('plus')) {
                    cartData[itemIndex].quantity++;
                    showNotification(`Added one more ${itemName} to cart`);
                } else if (e.target.classList.contains('minus')) {
                    cartData[itemIndex].quantity--;
                    if (cartData[itemIndex].quantity <= 0) {
                        cartData.splice(itemIndex, 1);
                        showNotification(`${itemName} removed from cart`);
                    } else {
                        showNotification(`Removed one ${itemName} from cart`);
                    }
                }
                saveCartToLocalStorage();
                updateCartSlider();
                updateCheckoutPage();
                updateCartCount();
            }
        });
    });
}

function updateCheckoutPage() {
    const cartContainer = document.getElementById('cart-container');
    if (!cartContainer) return;
    cartContainer.innerHTML = '';
    let subtotal = 0;

    cartData.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.innerHTML = `
            <img src="${item.image || 'default-image.jpg'}" alt="${item.name}">
            <div class="quantity-controls">
                <button class="quantity-btn minus" data-name="${item.name}">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn plus" data-name="${item.name}">+</button>
            </div>
            <span class="item-name">${item.name}</span>
            <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
            <i class="fas fa-trash-alt remove-item" data-name="${item.name}"></i>
        `;
        cartContainer.appendChild(itemElement);
        subtotal += item.price * item.quantity;
    });

    updateSummary(subtotal);
    updateRemoveListeners();
    updateQuantityListeners();
}

window.updatePickupBranch = function(branch) {
    const branchData = branchLocations[branch];
    const pickupMap = document.getElementById('pickup-map');
    const pickupAddress = document.getElementById('pickup-branch-address');

    if (pickupMap && pickupAddress) {
        pickupMap.src = branchData.mapSrc;
        pickupAddress.textContent = `${branchData.address} (${branchData.name})`;
    }

    if (currentMethod === 'pickup') {
        updateCheckoutPage();
    }
};

// DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    const cartButton = document.getElementById('cart-icon');
    const cartSlider = document.getElementById('cart-slider');
    const closeCartButton = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    const cartCount = document.getElementById('cart-count');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const promoBtn = document.getElementById('promo-btn');
    const signOutBtn = document.getElementById('sign-out-link');
    const userProfile = document.getElementById('user-profile');
    const googleSignIn = document.querySelector('.g_id_signin');

    updateCartSlider();
    updateCheckoutPage();
    updateCartCount();
    updatePickupBranch('dreamwood');

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        updateUserProfileUI(currentUser);
    }

    if (cartButton && cartSlider) {
        cartButton.addEventListener('click', () => {
            cartSlider.style.transform = 'translateX(0)';
            updateCartSlider();
        });
    }

    if (closeCartButton && cartSlider) {
        closeCartButton.addEventListener('click', () => {
            cartSlider.style.transform = 'translateX(100%)';
        });
    }

    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', () => {
            if (validateCheckoutForm()) {
                placeOrder();
            }
        });
    }

    if (promoBtn) {
        promoBtn.addEventListener('click', () => {
            const promoModal = document.getElementById('promo-modal');
            if (promoModal) promoModal.style.display = 'flex';
        });
    }

    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            signOut();
        });
    }

    const promoButtons = document.querySelectorAll('.promo-option');
    promoButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const promoCode = e.currentTarget.getAttribute('data-code');
            if (applyPromoCode(promoCode)) closePromoModal();
        });
    });

    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    const pageIdentifier = window.location.pathname.split('/').pop().split('.')[0] || 'default';
    addToCartButtons.forEach((button, index) => {
        const cartItem = cartData.find(item => item.index === `${pageIdentifier}-${index}`);
        if (cartItem) updateButtonState(button, cartItem);
        button.addEventListener('click', () => handleAddToCart(button, index));
    });

    function handleAddToCart(button, index) {
        const parentFoodItem = button.closest('.food-items');
        const parentDetails = button.closest('.details');
        if (!parentFoodItem || !parentDetails) return;

        const itemName = parentDetails.querySelector('h5')?.textContent;
        const itemPriceText = parentDetails.querySelector('.price')?.textContent;
        const itemImage = parentFoodItem.querySelector('img')?.src;

        if (!itemName || !itemPriceText || !itemImage) return;

        const itemPrice = parseFloat(itemPriceText.replace('$', ''));
        let cartItem = cartData.find(item => item.index === `${pageIdentifier}-${index}`);

        if (!cartItem) {
            cartItem = { 
                index: `${pageIdentifier}-${index}`, 
                name: itemName, 
                price: itemPrice, 
                image: itemImage, 
                quantity: 1 
            };
            cartData.push(cartItem);
        } else {
            cartItem.quantity++;
        }

        updateButtonState(button, cartItem);
        updateCartSlider();
        updateCheckoutPage();
        saveCartToLocalStorage();
    }

    function updateButtonState(button, cartItem) {
        button.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; background-color: orangered; padding: 5px; border-radius: 5px;">
                <button class="minus-btn" style="width: 20px; height: 20px; font-size: 14px;">-</button>
                <span class="cart-quantity" style="font-size: 14px;">${cartItem.quantity}</span>
                <button class="plus-btn" style="width: 20px; height: 20px; font-size: 14px;">+</button>
            </div>`;
        button.style.background = 'none';
        button.style.padding = '0';
        button.style.border = 'none';

        const minusButton = button.querySelector('.minus-btn');
        const plusButton = button.querySelector('.plus-btn');

        minusButton.addEventListener('click', (e) => {
            e.stopPropagation();
            handleQuantityChange(cartItem, button, -1);
        });

        plusButton.addEventListener('click', (e) => {
            e.stopPropagation();
            handleQuantityChange(cartItem, button, 1);
        });
    }

    function handleQuantityChange(cartItem, button, change) {
        cartItem.quantity += change;
        
        if (cartItem.quantity <= 0) {
            cartData = cartData.filter(item => item.index !== cartItem.index);
            button.innerHTML = 'Add To Cart';
            button.style.background = '';
            button.style.padding = '';
            button.style.border = '';
            const newButton = button.cloneNode(true);
            button.replaceWith(newButton);
            newButton.addEventListener('click', () => handleAddToCart(newButton, cartItem.index.split('-')[1]));
        } else {
            button.querySelector('.cart-quantity').textContent = cartItem.quantity;
        }

        updateCartSlider();
        updateCheckoutPage();
        saveCartToLocalStorage();
    }

    function updateCartSlider() {
        if (!cartItemsContainer || !cartCount) return;
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let totalItems = 0;

        cartData.forEach(item => {
            if (!item.price) return;
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.innerHTML = `
                <img src="${item.image || 'default-image.jpg'}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                <span class="item-name">${item.name}</span>
                <div class="quantity-controls">
                    <button class="quantity-btn minus" data-index="${item.index}">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus" data-index="${item.index}">+</button>
                </div>
                <span class="item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                <button class="delete-btn" data-index="${item.index}"><i class="fas fa-trash-alt"></i></button>
            `;
            cartItemsContainer.appendChild(itemElement);
            total += item.price * item.quantity;
            totalItems += item.quantity;
        });

        if (cartTotal) cartTotal.textContent = total.toFixed(2);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';

        attachCartEventListeners();
    }

    function attachCartEventListeners() {
        document.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.getAttribute('data-index');
                const cartItem = cartData.find(item => item.index === index);
                if (cartItem) {
                    if (e.target.classList.contains('plus')) {
                        cartItem.quantity++;
                    } else if (e.target.classList.contains('minus')) {
                        cartItem.quantity--;
                        if (cartItem.quantity <= 0) cartData = cartData.filter(item => item.index !== index);
                    }
                    updateCartSlider();
                    updateCheckoutPage();
                    saveCartToLocalStorage();
                }
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = e.target.closest('.delete-btn').getAttribute('data-index');
                cartData = cartData.filter(item => item.index !== index);
                updateCartSlider();
                updateCheckoutPage();
                saveCartToLocalStorage();
            });
        });
    }

    function updateCartCount() {
        const cartCountEl = document.getElementById('cart-count');
        if (!cartCountEl) return;
        const totalItems = cartData.reduce((sum, item) => sum + item.quantity, 0);
        cartCountEl.textContent = totalItems;
        cartCountEl.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    function saveCartToLocalStorage() {
        localStorage.setItem('cartData', JSON.stringify(cartData));
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.classList.add('notification');
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => document.body.removeChild(notification), 300);
            }, 2000);
        }, 10);
    }

    function applyPromoCode(promoCode) {
        const subtotal = cartData.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
        appliedDiscount = 0;

        if (!promoCodes[promoCode]) {
            showNotification('Invalid promo code');
            return false;
        }

        const discountValue = promoCodes[promoCode];
        const minOrderAmount = discountValue <= 1 ? 20 : 50;

        if (subtotal < minOrderAmount) {
            showNotification(`Minimum order of $${minOrderAmount} required for ${promoCode}`);
            return false;
        }

        appliedDiscount = discountValue <= 1 ? subtotal * discountValue : discountValue;
        showNotification('Promo code applied successfully!');
        updateCheckoutPage();
        updateSummary(subtotal);
        return true;
    }

    function placeOrder() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser?.id) {
            showNotification('Please sign in to place an order.');
            return;
        }

        const formElements = {
            name: document.getElementById('name'),
            phone: document.getElementById('phone'),
            email: document.getElementById('email'),
            selectedAddress: document.getElementById('selected-address'),
            payment: document.querySelector('input[name="payment"]:checked'),
            terms: document.getElementById('terms'),
            branch: document.querySelector('input[name="branch"]:checked')
        };

        if (!formElements.name || !formElements.phone || !formElements.terms || 
            (currentMethod === 'pickup' && !formElements.branch)) {
            showNotification('Missing required form elements');
            return;
        }

        const name = formElements.name.value;
        const phone = formElements.phone.value;
        const branchValue = formElements.branch?.value;
        const address = currentMethod === 'delivery' ? 
            formElements.selectedAddress?.textContent : 
            `${branchLocations[branchValue].address} (${branchLocations[branchValue].name})`;
        const paymentMethod = formElements.payment?.value;
        const termsChecked = formElements.terms.checked;

        if (!name || !phone.match(/^\d{10}$/) || 
            (currentMethod === 'delivery' && !address) || 
            (currentMethod === 'pickup' && !branchValue) || 
            !paymentMethod || !termsChecked) {
            showNotification('Please fill in all required fields correctly');
            return;
        }

        const subtotal = cartData.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
        const tax = subtotal * TAX_RATE;
        const total = currentMethod === 'delivery' ? 
            subtotal + tax + DELIVERY_FEE - appliedDiscount : 
            subtotal + tax - appliedDiscount;

        const order = {
            orderId: `ORD-${Math.floor(Math.random() * 1000000)}`,
            date: new Date().toLocaleString(),
            items: cartData,
            totalCost: total.toFixed(2),
            status: 'Processed',
            method: currentMethod,
            address,
            pickupTime: document.getElementById('selected-pickup-time')?.textContent || 'Standard - Ready in 15 minutes',
            paymentMethod,
            discount: appliedDiscount,
            closed: false
        };

        fetch(`https://plantopia-1.onrender.com/api/users/${currentUser.id}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            cartData = [];
            saveCartToLocalStorage();
            showNotification('Order placed successfully!');
            updateCartSlider();
            updateCheckoutPage();
            window.location.href = 'active-orders.html';
        })
        .catch(err => {
            showNotification(`Failed to place order: ${err.message}`);
        });
    }

    function updateAddressFromLatLng(latLng) {
        if (!geocoder) return;
        geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const address = results[0].formatted_address;
                document.getElementById('map-selected-address').textContent = address;
            } else {
                showNotification('Could not determine address from location');
            }
        });
    }

    window.toggleMethod = function(method) {
        currentMethod = method;
        const elements = {
            timeHeading: document.getElementById('time-heading'),
            pickupTime: document.getElementById('pickup-time'),
            deliveryAddress: document.getElementById('delivery-address'),
            pickupAddress: document.getElementById('pickup-address'),
            branchSelection: document.getElementById('branch-selection'),
            payAtCounter: document.getElementById('pay-at-counter'),
            cashOnDelivery: document.getElementById('cash-on-delivery'),
            placeOrderBtn: document.getElementById('place-order-btn')
        };

        if (!Object.values(elements).every(el => el)) return;

        elements.timeHeading.textContent = method === 'pickup' ? 'Pickup Time' : 'Delivery Time';
        elements.pickupTime.style.display = 'block';
        elements.deliveryAddress.style.display = method === 'delivery' ? 'block' : 'none';
        elements.pickupAddress.style.display = method === 'pickup' ? 'block' : 'none';
        elements.branchSelection.style.display = method === 'pickup' ? 'block' : 'none';
        elements.payAtCounter.style.display = method === 'pickup' ? 'flex' : 'none';
        elements.cashOnDelivery.style.display = method === 'delivery' ? 'flex' : 'none';
        elements.placeOrderBtn.textContent = method === 'pickup' ? 'PLACE PICKUP ORDER' : 'PLACE DELIVERY ORDER';

        if (method === 'delivery') {
            const selectedAddress = document.getElementById('selected-address').textContent;
            if (selectedAddress !== 'Not selected') {
                updateDeliveryMapIframe(selectedAddress);
            }
        }

        updateCheckoutPage();
    };

    window.openScheduleModal = function() {
        const modal = document.getElementById('schedule-modal');
        const title = document.getElementById('schedule-modal-title');
        if (!modal || !title) {
            showNotification('Schedule modal not found');
            return;
        }
        
        title.textContent = currentMethod === 'pickup' ? 'Schedule Pickup' : 'Schedule Delivery';
        modal.style.display = 'flex';
        const today = new Date();
        const scheduleDate = document.getElementById('schedule-date');
        if (scheduleDate) {
            scheduleDate.min = today.toISOString().split('T')[0];
            scheduleDate.value = today.toISOString().split('T')[0];
            scheduleDate.addEventListener('change', generateTimeSlots);
        }
        generateTimeSlots();
    };

    window.closeScheduleModal = function() {
        const modal = document.getElementById('schedule-modal');
        if (modal) modal.style.display = 'none';
    };

    window.saveSchedule = function() {
        const date = document.getElementById('schedule-date')?.value;
        const selectedSlot = document.querySelector('.time-slot.selected');
        const pickupTimeSection = document.getElementById('pickup-time-section');
        const selectedPickupTime = document.getElementById('selected-pickup-time');
        
        if (!date || !selectedSlot || !pickupTimeSection || !selectedPickupTime) {
            showNotification('Please select a date and time slot.');
            return;
        }
        
        selectedPickupTime.textContent = `${date} ${selectedSlot.textContent}`;
        pickupTimeSection.classList.remove('hidden');
        closeScheduleModal();
    };

    window.openAddressModal = function() {
        const modal = document.getElementById('address-modal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => {
                if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
                    window.initMap();
                } else {
                    console.error('Google Maps API not loaded');
                    showNotification('Google Maps failed to load. You can still enter an address manually.');
                }
            }, 100);
        }
    };

    window.closeAddressModal = function() {
        const modal = document.getElementById('address-modal');
        if (modal) modal.style.display = 'none';
    };

    window.confirmMapAddress = function() {
        const selectedAddress = document.getElementById('map-selected-address').textContent;
        if (selectedAddress && selectedAddress !== 'Not selected') {
            document.getElementById('selected-address').textContent = selectedAddress;
            if (currentMethod === 'delivery') {
                updateDeliveryMapIframe(selectedAddress);
            }
            closeAddressModal();
        } else {
            showNotification('Please select an address on the map');
        }
    };

    window.useManualAddress = function() {
        const manualAddress = document.getElementById('manual-address-input').value.trim();
        if (manualAddress) {
            document.getElementById('selected-address').textContent = manualAddress;
            if (currentMethod === 'delivery') {
                updateDeliveryMapIframe(manualAddress);
            }
            closeAddressModal();
        } else {
            showNotification('Please enter a valid address');
        }
    };

    function updateDeliveryMapIframe(address) {
        const deliveryMapContainer = document.getElementById('delivery-map-container');
        if (!deliveryMapContainer) return;

        const encodedAddress = encodeURIComponent(address);
        const iframeSrc = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodedAddress}`;
        deliveryMapContainer.innerHTML = `
            <iframe
                width="100%"
                height="150"
                style="border:0;"
                allowfullscreen=""
                loading="lazy"
                src="${iframeSrc}">
            </iframe>`;
    }

    window.closePromoModal = function() {
        const promoModal = document.getElementById('promo-modal');
        if (promoModal) promoModal.style.display = 'none';
    };

    function generateTimeSlots() {
        const timeSlotsContainer = document.getElementById('time-slots');
        if (!timeSlotsContainer) return;
        
        timeSlotsContainer.innerHTML = '';
        const startHour = 11;
        const endHour = 21;
        const interval = 30;
        const today = new Date();
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();
        const scheduleDate = document.getElementById('schedule-date')?.value;

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += interval) {
                if (scheduleDate === today.toISOString().split('T')[0]) {
                    if (hour < currentHour || (hour === currentHour && minute <= currentMinute)) continue;
                }
                const startTime = formatTime(hour, minute);
                const endTime = formatTime(hour, minute + interval);
                const timeSlot = document.createElement('div');
                timeSlot.classList.add('time-slot');
                timeSlot.textContent = `${startTime} - ${endTime}`;
                timeSlot.addEventListener('click', () => {
                    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
                    timeSlot.classList.add('selected');
                });
                timeSlotsContainer.appendChild(timeSlot);
            }
        }
    }

    function formatTime(hour, minute) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
        const formattedMinute = String(minute).padStart(2, '0');
        return `${formattedHour}:${formattedMinute}${period}`;
    }
});

function validateCheckoutForm() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const paymentMethod = document.querySelector('input[name="payment"]:checked');
    const selectedAddress = document.getElementById('selected-address')?.textContent;

    if (!name || !phone || !paymentMethod || (currentMethod === 'delivery' && selectedAddress === 'Not selected')) {
        showNotification('Please fill out all required fields, including delivery address if applicable.');
        return false;
    }
    return true;
}

function handleCredentialResponse(response) {
    const user = parseJwt(response.credential);
    localStorage.setItem('currentUser', JSON.stringify(user));
    updateUserProfileUI(user);
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
    return JSON.parse(jsonPayload);
}

function updateUserProfileUI(user) {
    const userProfile = document.getElementById('user-profile');
    const googleSignIn = document.querySelector('.g_id_signin');
    const userName = document.getElementById('user-name');
    const userPicture = document.getElementById('user-picture');

    if (userProfile && googleSignIn && userName && userPicture) {
        userProfile.style.display = 'block';
        googleSignIn.style.display = 'none';
        userName.textContent = user.name || user.email.split('@')[0];
        userPicture.src = user.picture || '';
    }
}

function signOut() {
    const userProfile = document.getElementById('user-profile');
    const googleSignIn = document.querySelector('.g_id_signin');

    localStorage.removeItem('currentUser');
    if (userProfile && googleSignIn) {
        userProfile.style.display = 'none';
        googleSignIn.style.display = 'block';
        document.getElementById('user-name').textContent = '';
        document.getElementById('user-picture').src = '';
    }
    window.location.reload();
}
