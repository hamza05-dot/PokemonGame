/**
 * Navigation Menu Toggle Functionality
 * Handles mobile menu without freezing the vertical scroll
 */

// Helper to handle body locking without breaking vertical scroll
function toggleMenuState(isOpen) {
    const body = document.body;
    if (isOpen) {
        // Stop sideways sliding, but allow vertical movement
        body.style.overflowX = 'hidden'; 
        // We remove 'touch-action: none' so your finger can move again
        body.style.touchAction = 'pan-y'; 
    } else {
        body.style.overflowX = 'hidden';
        body.style.touchAction = 'auto';
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
        
        // Update body state
        toggleMenuState(isActive);
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

    if (navMenu?.classList.contains('active')) {
        navToggle?.classList.remove('active');
        navMenu?.classList.remove('active');
        navLinks?.classList.remove('active');
        toggleMenuState(false);
    }
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const navToggle = document.getElementById('navToggle');
    const navbar = document.querySelector('.navbar, .nav-bar');

    if (!navbar || !navToggle) return;

    const isClickInsideNav = navbar.contains(event.target);
    const navMenu = document.getElementById('navMenu');
    const isMenuOpen = navMenu?.classList.contains('active');

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
    
    // Force horizontal lock on load
    document.documentElement.style.overflowX = 'hidden';
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
