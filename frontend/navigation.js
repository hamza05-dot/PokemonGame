/**
 * Navigation Menu Toggle Functionality
 * Handles mobile menu open/close
 */

// Toggle menu function
function toggleMenu() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelector('.nav-links');
    
    // Handle both navbar and nav-bar structures
    if (navToggle && navMenu) {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    }
    
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
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
        navToggle?.classList.remove('active');
        navMenu?.classList.remove('active');
        navLinks?.classList.remove('active');
    }
});

// Close menu when clicking on a link
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link, .nav-btn');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const navToggle = document.getElementById('navToggle');
            const navMenu = document.getElementById('navMenu');
            const navLinksContainer = document.querySelector('.nav-links');
            
            // Close menu on mobile when link is clicked
            if (window.innerWidth <= 768) {
                navToggle?.classList.remove('active');
                navMenu?.classList.remove('active');
                navLinksContainer?.classList.remove('active');
            }
        });
    });
});

// Handle window resize
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        if (window.innerWidth > 768) {
            const navToggle = document.getElementById('navToggle');
            const navMenu = document.getElementById('navMenu');
            const navLinks = document.querySelector('.nav-links');
            
            navToggle?.classList.remove('active');
            navMenu?.classList.remove('active');
            navLinks?.classList.remove('active');
        }
    }, 250);
});
