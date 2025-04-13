document.addEventListener('DOMContentLoaded', () => {
    const orderHistoryContainer = document.getElementById('order-history-container');
    const notification = document.getElementById('notification');
    const userProfile = document.getElementById('user-profile');
    const userName = document.getElementById('user-name');
    const signOutLink = document.getElementById('sign-out-link');
    const googleSignInDiv = document.querySelector('.g_id_signin');

    function showNotification(message, isError = false) {
        if (!notification.classList.contains('show')) {
            notification.textContent = message;
            notification.style.backgroundColor = isError ? '#ff4444' : '#4CAF50';
            notification.classList.add('show');
            setTimeout(() => notification.classList.remove('show'), 2000);
        }
    }

    // Check if user is signed in and update UI
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        userProfile.style.display = 'flex';
        userName.textContent = currentUser.name || 'User';
        googleSignInDiv.style.display = 'none';
    } else {
        userProfile.style.display = 'none';
        googleSignInDiv.style.display = 'block';
    }

    // Sign out functionality
    if (signOutLink) {
        signOutLink.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(); // Call the signOut function from auth.js
            localStorage.removeItem('currentUser');
            userProfile.style.display = 'none';
            googleSignInDiv.style.display = 'block';
            showNotification('Signed out successfully.');
            fetchOrders();
            fetchReservations();
        });
    }

    // Google Sign-In callback
    window.handleCredentialResponse = (response) => {
        const userData = JSON.parse(atob(response.credential.split('.')[1]));
        const user = {
            id: userData.sub,
            name: userData.name,
            email: userData.email
        };
        localStorage.setItem('currentUser', JSON.stringify(user));
        userProfile.style.display = 'flex';
        userName.textContent = user.name;
        googleSignInDiv.style.display = 'none';
        showNotification('Signed in successfully.');
        fetchOrders();
        fetchReservations();
    };

    // Initialize UI with tabs for Orders and Reservations
    orderHistoryContainer.innerHTML = `
        <div class="order-tabs">
            <button class="tab-btn active" data-tab="active">Active Orders</button>
            <button class="tab-btn" data-tab="previous">Previous Orders</button>
            <button class="tab-btn" data-tab="reservations">Active Reservations</button>
        </div>
        <div id="active-orders" class="tab-content active"></div>
        <div id="previous-orders" class="tab-content" style="display: none;"></div>
        <div id="reservations" class="tab-content" style="display: none;"></div>
    `; 

    fetchOrders();
    fetchReservations();

    function fetchOrders() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { id: 'default-user-id' };
        fetch(`https://plantopiawebsite-final.onrender.com/api/users/${currentUser.id}/orders`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch orders');
                return response.json();
            })
            .then(orders => {
                const activeOrders = orders.filter(order => !order.closed);
                const previousOrders = orders.filter(order => order.closed);

                displayOrders(activeOrders, document.getElementById('active-orders'), true);
                displayOrders(previousOrders, document.getElementById('previous-orders'), false);

                if (activeOrders.length === 0) {
                    document.getElementById('active-orders').innerHTML = '<p>No active orders found.</p>';
                }
                if (previousOrders.length === 0) {
                    document.getElementById('previous-orders').innerHTML = '<p>No previous orders found.</p>';
                }
            })
            .catch(err => {
                console.error('Error fetching orders:', err);
                orderHistoryContainer.innerHTML = '<p>Error loading orders. Please try again later.</p>';
                showNotification('Error loading orders.', true);
            });
    }

    function fetchReservations() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            displayReservations([]);
            return;
        }

        fetch(`https://plantopiawebsite-final.onrender.com/api/users/${currentUser.id}/reservations`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch reservations');
                return response.json();
            })
            .then(reservations => {
                displayReservations(reservations);
            })
            .catch(err => {
                console.error('Error fetching reservations:', err);
                showNotification('Error loading reservations.', true);
                displayReservations([]);
            });
    }

    function displayOrders(orders, container, showTracker = false) {
        container.innerHTML = '';
        orders.forEach((order, index) => {
            let trackerHTML = '';
            if (showTracker) {
                const progress = 1; // Example progress; adjust based on order status
                trackerHTML = `
                    <div class="order-tracker">
                        <div class="row d-flex justify-content-between px-3 top">
                            <div class="d-flex">
                                <h5>ORDER <span class="text-primary font-weight-bold">#${order.orderId}</span></h5>
                            </div>
                        </div>
                        <div class="row d-flex justify-content-center">
                            <div class="col-12">
                                <ul id="progressbar-${order.orderId}" class="text-center">
                                    <li class="${progress >= 1 ? 'active' : ''} step0"></li>
                                    <li class="${progress >= 2 ? 'active' : ''} step0"></li>
                                    <li class="${progress >= 3 ? 'active' : ''} step0"></li>
                                    <li class="${progress >= 4 ? 'active' : ''} step0"></li>
                                </ul>
                            </div>
                        </div>
                        <div class="row justify-content-between top">
                            <div class="row d-flex icon-content">
                                <i class="icon fa fa-check-circle"></i>
                                <div class="d-flex flex-column">
                                    <p class="font-weight-bold">Order<br>Placed</p>
                                </div>
                            </div>
                            <div class="row d-flex icon-content">
                                <i class="icon fa fa-concierge-bell"></i>
                                <div class="d-flex flex-column">
                                    <p class="font-weight-bold">In the<br>Kitchen</p>
                                </div>
                            </div>
                            <div class="row d-flex icon-content">
                                <i class="icon fas fa-box-open"></i>
                                <div class="d-flex flex-column">
                                    <p class="font-weight-bold">Wrapping <br>It Up</p>
                                </div>
                            </div>
                            <div class="row d-flex icon-content">
                                <i class="icon fa fa-check-circle"></i>
                                <div class="d-flex flex-column">
                                    <p class="font-weight-bold">Order Ready<br></p>
                                </div>
                            </div>
                        </div>
                        <div class="dropdown-arrow">
                            <i class="fa fa-chevron-down toggle-details" data-order-id="${order.orderId}"></i>
                        </div>
                        <div class="order-details" id="details-${order.orderId}">
                            <h4>Order #${order.orderId}</h4>
                            <p><strong>Date:</strong> ${order.date}</p>
                            <p><strong>Total:</strong> $${order.totalCost}</p>
                            <p><strong>Status:</strong> ${order.status}</p>
                            <p><strong>Method:</strong> ${order.method}</p>
                            <p><strong>Address:</strong> ${order.address}</p>
                            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                            <div class="order-buttons">
                                <button class="btn btn-primary view-order-btn" data-order-id="${order.orderId}">View Details</button>
                                ${!order.closed ? `<button class="btn btn-secondary close-order-btn" data-order-id="${order.orderId}">Close Order</button>` : ''}
                            </div>
                            <div class="ordered-items" id="items-${order.orderId}">
                                <h5>Ordered Items</h5>
                                <ul>
                                    ${order.items.map(item => `
                                        <li>${item.name} - Quantity: ${item.quantity} - $${item.price}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                trackerHTML = `
                    <div class="order-tracker">
                        <div class="order-details active">
                            <h4>Order #${order.orderId}</h4>
                            <p><strong>Date:</strong> ${order.date}</p>
                            <p><strong>Total:</strong> $${order.totalCost}</p>
                            <p><strong>Status:</strong> ${order.status}</p>
                            <p><strong>Method:</strong> ${order.method}</p>
                            <p><strong>Address:</strong> ${order.address}</p>
                            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                            <div class="order-buttons">
                                <button class="btn btn-primary view-order-btn" data-order-id="${order.orderId}">View Details</button>
                            </div>
                            <div class="ordered-items" id="items-${order.orderId}">
                                <h5>Ordered Items</h5>
                                <ul>
                                    ${order.items.map(item => `
                                        <li>${item.name} - Quantity: ${item.quantity} - $${item.price}</li>
                                    `).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            }

            const orderElement = document.createElement('div');
            orderElement.classList.add('order-history-item');
            orderElement.innerHTML = trackerHTML;
            container.appendChild(orderElement);
        });

        // Toggle order details
        container.querySelectorAll('.toggle-details').forEach(button => {
            button.addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-order-id');
                const detailsSection = document.getElementById(`details-${orderId}`);
                detailsSection.classList.toggle('active');
                e.target.classList.toggle('active');
            });
        });

        // Toggle ordered items
        container.querySelectorAll('.view-order-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-order-id');
                const itemsSection = document.getElementById(`items-${orderId}`);
                itemsSection.classList.toggle('active');
            });
        });

        // Close order functionality
        container.querySelectorAll('.close-order-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const orderId = e.target.getAttribute('data-order-id');
                const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { id: 'default-user-id' };
                fetch(`https://plantopiawebsite-final.onrender.com/api/users/${currentUser.id}/orders/${orderId}/close`, {
                    method: 'PUT'
                })
                .then(response => {
                    if (!response.ok) throw new Error('Failed to close order');
                    showNotification('Order closed successfully.');
                    fetchOrders();
                })
                .catch(err => {
                    console.error('Error closing order:', err);
                    showNotification('Error closing order.', true);
                });
            });
        });
    }

    // Tab switching logic
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.style.display = 'none');

            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            const activeTab = document.getElementById(`${tabId}-orders`) || document.getElementById(`${tabId}`);
            activeTab.style.display = 'block';

            if (tabId === 'reservations') {
                fetchReservations();
            }
        });
    });

    function displayReservations(reservations) {
        const reservationContainer = document.getElementById('reservations');
        if (!reservationContainer) return;

        reservationContainer.innerHTML = '';

        const activeReservations = reservations.filter(res => !res.cancelled);

        if (activeReservations.length === 0) {
            reservationContainer.innerHTML = '<p>No active reservations found.</p>';
            return;
        }

        activeReservations.forEach(reservation => {
            const reservationElement = document.createElement('div');
            reservationElement.classList.add('reservation-item');
            reservationElement.innerHTML = `
                <p><strong>Reservation ID:</strong> ${reservation.reservationId}</p>
                <p><strong>Table:</strong> ${reservation.table}</p>
                <p><strong>Name:</strong> ${reservation.name}</p>
                <p><strong>Guests:</strong> ${reservation.people}</p>
                <p><strong>Date:</strong> ${new Date(reservation.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${reservation.time}</p>
                <p><strong>Branch:</strong> ${reservation.branch === 'dreamwood' ? 'Dreamwood' : 'Heavengarden'}</p>
                <hr>
            `;
            reservationContainer.appendChild(reservationElement);
        });
    }
});
