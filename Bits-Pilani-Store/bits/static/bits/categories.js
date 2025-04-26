document.addEventListener('DOMContentLoaded', function() {
    // Add click animation to category cards
    const cards = document.querySelectorAll('.category-card');
    
    cards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Add temporary click effect
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
        });
    });

    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const focused = document.activeElement;
            if (focused && focused.classList.contains('category-card')) {
                const index = Array.from(cards).indexOf(focused);
                const direction = e.key === 'ArrowRight' ? 1 : -1;
                const newIndex = (index + direction + cards.length) % cards.length;
                cards[newIndex].focus();
            }
        }
    });
});
