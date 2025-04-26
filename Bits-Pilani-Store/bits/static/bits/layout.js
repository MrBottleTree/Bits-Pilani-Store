// Toggle dropdown menu for profile
document.querySelector('.profile-pic').addEventListener('click', function(e) {
    e.stopPropagation(); // Prevent event from bubbling up
    document.querySelector('.dropdown-menu').classList.toggle('active');
});

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.profile-container')) {
        document.querySelector('.dropdown-menu').classList.remove('active');
    }
});

// Animated search functionality
const searchContainer = document.getElementById('searchContainer');
const searchIcon = document.getElementById('searchIcon');
const searchInput = document.getElementById('searchInput');
const cancelSearch = document.getElementById('cancelSearch');

if (searchIcon) {
    searchIcon.addEventListener('click', function() {
        searchContainer.classList.add('expanded');
        setTimeout(() => {
            searchInput.focus();
        }, 100);
    });
}

if (cancelSearch) {
    cancelSearch.addEventListener('click', function(e) {
        e.preventDefault();
        searchContainer.classList.remove('expanded');
        searchInput.value = '';
    });
}

// Close search when clicking outside
document.addEventListener('click', function(event) {
    if (searchContainer && !searchContainer.contains(event.target) && searchContainer.classList.contains('expanded')) {
        searchContainer.classList.remove('expanded');
    }
});

// Message notification system
document.addEventListener('DOMContentLoaded', function() {
    // Message close functionality
    const messages = document.querySelectorAll('.message');
    
    messages.forEach(message => {
        // Auto-dismiss after 2 seconds
        setTimeout(() => {
            if (message && message.parentNode) {
                message.classList.add('fade-out');
                setTimeout(() => {
                    if (message && message.parentNode) {
                        message.parentNode.removeChild(message);
                    }
                }, 300);
            }
        }, 2000);
        
        // Close button functionality
        const closeBtn = message.querySelector('.message-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent event from bubbling
                message.classList.add('fade-out');
                setTimeout(() => {
                    if (message && message.parentNode) {
                        message.parentNode.removeChild(message);
                    }
                }, 300);
            });
        }
    });
    
    // Campus dropdown functionality - desktop
    const desktopCampusBtn = document.querySelector('.campus-filter-container .campus-btn');
    if (desktopCampusBtn) {
        desktopCampusBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const menu = this.nextElementSibling;
            menu.classList.toggle('show');
        });
    }
    
    // Campus dropdown functionality - mobile
    const mobileCampusBtn = document.querySelector('.mobile-campus-btn');
    if (mobileCampusBtn) {
        mobileCampusBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const menu = this.nextElementSibling;
            menu.classList.toggle('show');
        });
    }
    
    // Close campus menus when clicking outside
    document.addEventListener('click', function(e) {
        const campusMenus = document.querySelectorAll('.campus-menu');
        campusMenus.forEach(menu => {
            if (!menu.parentNode.contains(e.target)) {
                menu.classList.remove('show');
            }
        });
    });
});