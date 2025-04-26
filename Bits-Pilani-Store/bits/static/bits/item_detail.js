document.addEventListener('DOMContentLoaded', function() {
    const mainImage = document.getElementById('main-image');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            const imageUrl = this.getAttribute('data-image-url');
            mainImage.src = imageUrl;
            
            thumbnails.forEach(thumb => thumb.classList.remove('active'));
            this.classList.add('active');
        });
    });

    const showContactInfoBtn = document.getElementById('show-contact-info');
    const contactModal = document.getElementById('contact-modal');
    const closeModal = document.querySelector('.close-modal');
    
    if (showContactInfoBtn) {
        showContactInfoBtn.addEventListener('click', function() {
            contactModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            contactModal.style.display = 'none';
            document.body.style.overflow = '';
        });
    }
    
    window.addEventListener('click', function(event) {
        if (event.target === contactModal) {
            contactModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
    
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }
    
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            const mainImageContainer = document.querySelector('.main-image-container');
            if (window.innerWidth > window.innerHeight) {
                mainImageContainer.style.height = '200px';
            } else {
                if (window.innerWidth < 768) {
                    mainImageContainer.style.height = '250px';
                }
            }
        }, 200);
    });
    
    if ('ontouchstart' in window) {
        const buttons = document.querySelectorAll('.contact-btn');
        buttons.forEach(button => {
            button.addEventListener('touchstart', function() {
                this.style.opacity = '0.8';
            });
            button.addEventListener('touchend', function() {
                this.style.opacity = '1';
                setTimeout(() => {
                    this.style.opacity = '1';
                }, 100);
            });
        });
    }
});
