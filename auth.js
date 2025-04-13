// Handle Google Sign-In credential response
function handleCredentialResponse(response) {
    console.log('Credential Response:', response);
    if (!response || !response.credential) {
        console.error('No credential received from Google Sign-In');
        return;
    }

    const userInfo = parseJwt(response.credential);
    const user = {
        id: userInfo.sub,
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture || 'guest.jpg',
        isGuest: false
    };

    localStorage.setItem('currentUser', JSON.stringify(user));
    updateUserProfileUI(user);
    showWelcomeNotification(user);

    // Send user data to backend
    fetch('https://plantopiawebsite-final.onrender.com/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            googleId: user.id,
            name: user.name,
            email: user.email,
            picture: user.picture
        })
    })
    .then(res => res.json().then(data => console.log('Backend Response:', data)))
    .catch(err => console.error('Error saving user:', err));
}

// Parse JWT token from Google
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
}

// Update UI based on user sign-in status
function updateUserProfileUI(user) {
    const userProfile = document.getElementById('user-profile');
    const userName = document.getElementById('user-name');
    const userPicture = document.getElementById('user-picture');
    const authOptions = document.getElementById('auth-options');

    if (!userProfile || !userName || !userPicture || !authOptions) {
        console.error('Missing DOM elements in updateUserProfileUI:', {
            userProfile: !!userProfile,
            userName: !!userName,
            userPicture: !!userPicture,
            authOptions: !!authOptions
        });
        return;
    }

    if (user) {
        console.log('Updating profile UI for user:', user.name);
        userName.textContent = user.name || 'Guest';
        userPicture.src = user.picture || 'images/guest.jpg';
        userPicture.onerror = () => {
            console.warn('Profile picture failed to load, using fallback');
            userPicture.src = 'images/guest.jpg';
        };
        userProfile.style.display = 'flex';
        authOptions.style.display = 'none';
    } else {
        console.log('Clearing profile UI');
        userProfile.style.display = 'none';
        authOptions.style.display = 'block';
        userPicture.src = 'guest.jpg';
    }
}

// Show welcome notification
function showWelcomeNotification(user) {
    const notification = document.getElementById('welcome-notification');
    const message = document.getElementById('welcome-message');
    const closeBtn = document.getElementById('close-notification');

    if (!notification || !message || !closeBtn) {
        console.error('Notification elements not found');
        return;
    }

    const text = user.isGuest 
        ? `Welcome, ${user.name}! 🌟 Enjoy your visit!` 
        : `Welcome back, ${user.name}! 😊`;
    message.textContent = text;

    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10); // Slight delay for fade-in effect

    closeBtn.onclick = () => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300); // Match transition duration
    };

    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300);
    }, 5000);
}

// Sign out the user
function signOut() {
    console.log('Signing out...');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cartData');
    updateUserProfileUI(null);

    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        google.accounts.id.disableAutoSelect();
        google.accounts.id.cancel();
        reinitializeGoogleSignIn();
    } else {
        console.warn('Google library not available during sign-out');
        reinitializeGoogleSignIn();
    }
}

// Initialize Google Sign-In
function initializeGoogleSignIn() {
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
        console.error('Google Identity Services not loaded');
        return;
    }

    console.log('Initializing Google Sign-In...');
    google.accounts.id.initialize({
        client_id: '393903945324-dkvoequ09ml50t2lbfjhf5rped7sijp4.apps.googleusercontent.com',
        callback: handleCredentialResponse,
        auto_select: false,
        context: 'signin',
        ux_mode: 'popup',
        itp_support: true
    });

    const signInDiv = document.querySelector('.g_id_signin');
    if (signInDiv) {
        signInDiv.innerHTML = '';
        google.accounts.id.renderButton(signInDiv, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'sign_in_with',
            shape: 'rectangular',
            logo_alignment: 'left'
        });
        console.log('Sign-in button rendered');
    } else {
        console.error('Sign-in div not found');
    }

    google.accounts.id.prompt((notification) => {
        console.log('Prompt notification:', notification);
    });
}

// Reinitialize Google Sign-In after sign-out
function reinitializeGoogleSignIn() {
    console.log('Reinitializing Google Sign-In...');
    initializeGoogleSignIn();
}

// Handle Guest Sign-in
function handleGuestSignIn() {
    const popup = document.getElementById('guest-popup');
    const submitBtn = document.getElementById('guest-submit');
    const cancelBtn = document.getElementById('guest-cancel');
    const closeBtn = document.getElementById('guest-popup-close');

    if (!popup || !submitBtn || !cancelBtn || !closeBtn) {
        console.error('Guest popup elements not found');
        return;
    }

    popup.style.display = 'block';

    submitBtn.onclick = () => {
        const nameInput = document.getElementById('guest-name');
        if (!nameInput) {
            console.error('Guest name input not found');
            return;
        }
        const name = nameInput.value.trim();
        if (name) {
            const guestUser = {
                id: 'guest_' + Date.now(),
                name: name,
                picture: 'guest.jpg',
                isGuest: true
            };
            localStorage.setItem('currentUser', JSON.stringify(guestUser));
            popup.style.display = 'none'; // Close popup

            // Ensure UI updates after DOM is stable
            requestAnimationFrame(() => {
                updateUserProfileUI(guestUser);
                showWelcomeNotification(guestUser);
            });
        } else {
            alert('Please enter a name!');
        }
    };

    const closePopup = () => {
        popup.style.display = 'none';
    };

    cancelBtn.onclick = closePopup;
    closeBtn.onclick = closePopup;
}

// Load initial state
document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth.js: DOM Content Loaded');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        console.log('Auth.js: Found currentUser, updating UI for:', currentUser.name);
        updateUserProfileUI(currentUser);
    } else {
        console.log('Auth.js: No currentUser found');
    }

    if (typeof google !== 'undefined' && google.accounts) {
        initializeGoogleSignIn();
    } else {
        console.warn('Google script not loaded yet, waiting...');
        const scriptCheck = setInterval(() => {
            if (typeof google !== 'undefined' && google.accounts) {
                clearInterval(scriptCheck);
                initializeGoogleSignIn();
            }
        }, 100);
    }

    const guestSignInBtn = document.getElementById('guest-signin');
    if (guestSignInBtn) {
        guestSignInBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleGuestSignIn();
        });
    } else {
        console.error('Guest sign-in button not found');
    }
});
