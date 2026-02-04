/**
 * Navigation Menu Toggle Functionality
 * Handles mobile menu open/close and body scroll locking
 */

// Helper to handle body scroll locking
function toggleBodyScroll(isLocked) {
    if (isLocked) {
        // Prevent background scrolling and "finger slide"
        document.body.style.overflowX = 'hidden';
        document.body.style.overflowY = 'hidden';
        document.body.style.touchAction = 'none'; // Disables all touch gestures on body
    } else {
        // Restore scrolling
        document.body.style.overflowX = 'hidden'; // Keep hidden to prevent side-swipe
        document.body.style.overflowY = 'auto';
        document.body.style.touchAction = 'auto';
    }
}

// Toggle menu function
function toggleMenu() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navMenu) {
        const isActive = navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Lock body scroll when menu is active
        toggleBodyScroll(isActive);
    }

    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// Close menu function (Helper)
function closeAllMenus() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelector('.nav-links');

    navToggle?.classList.remove('active');
    navMenu?.classList.remove('active');
    navLinks?.classList.remove('active');
    
    // Always unlock body when closing
    toggleBodyScroll(false);
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelector('.nav-links');
    const navbar = document.querySelector('.navbar, .nav-bar');

    if (!navbar || !navToggle) return;

    const isClickInsideNav = navbar.contains(event.target);
    const isMenuOpen = navMenu?.classList.contains('active') || navLinks?.classList.contains('active');

    if (!isClickInsideNav && isMenuOpen) {
        closeAllMenus();
    }
});

// Close menu when clicking on a link
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link, .nav-btn');

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeAllMenus();
            }
        });
    });
    
    // Prevent horizontal overflow on load
    document.body.style.overflowX = 'hidden';
});

// Handle window resize
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        if (window.innerWidth > 768) {
            closeAllMenus();
        }
    }, 250);
});
