/**
 * Navigation Menu Toggle Functionality
 */

// Toggle menu function
function toggleMenu() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    }
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navbar = document.querySelector('.navbar, .nav-bar');

    if (!navbar || !navToggle || !navMenu) return;

    const isClickInsideNav = navbar.contains(event.target);
    const isMenuOpen = navMenu.classList.contains('active');

    if (!isClickInsideNav && isMenuOpen) {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
    }
});

// Close menu when clicking on a link
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link, .nav-btn');

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                const navToggle = document.getElementById('navToggle');
                const navMenu = document.getElementById('navMenu');
                navToggle?.classList.remove('active');
                navMenu?.classList.remove('active');
            }
        });
    });
});

// Reset menu on resize
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        navToggle?.classList.remove('active');
        navMenu?.classList.remove('active');
    }
});
