document.addEventListener('DOMContentLoaded', function() {
    const itemCards = document.querySelectorAll('.item-card');
    const selectCheckboxes = document.querySelectorAll('.item-select');
    const selectionToolbar = document.querySelector('.selection-toolbar');
    const selectionCount = document.querySelector('.selection-count');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const cancelSelectionBtn = document.getElementById('cancelSelectionBtn');
    const repostSelectedBtn = document.getElementById('repostSelectedBtn');
    const toggleSoldBtn = document.getElementById('toggleSoldBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const bulkActionForm = document.getElementById('bulkActionForm');
    const selectedItemsInput = document.getElementById('selectedItems');
    const actionInput = document.getElementById('action');
    
    let selectedItems = new Set();
    let selectionMode = false;
    let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Variables for long press detection
    let longPressTimer;
    let longPressDuration = 500; // ms
    let isLongPressing = false;
    let touchStartX = 0;
    let touchStartY = 0;
    
    // Initialize event listeners for each item card
    itemCards.forEach(card => {
        const checkbox = card.querySelector('.item-select');
        const itemContent = card.querySelector('.item-content');
        
        // Handle checkbox state changes
        checkbox.addEventListener('change', function() {
            const itemId = card.dataset.id;
            
            if (this.checked) {
                card.classList.add('selected');
                selectedItems.add(itemId);
            } else {
                card.classList.remove('selected');
                selectedItems.delete(itemId);
            }
            
            updateSelectionToolbar();
        });
        
        // For desktop: Make item clickable in selection mode
        if (!isMobile) {
            // Make checkbox visible on hover for desktop
            card.addEventListener('mouseenter', function() {
                if (selectionMode) {
                    checkbox.classList.add('visible');
                }
            });
            
            card.addEventListener('mouseleave', function() {
                if (!checkbox.checked && !selectionMode) {
                    checkbox.classList.remove('visible');
                }
            });
            
            // Click behavior for desktop
            itemContent.addEventListener('click', function(e) {
                if (selectionMode) {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleItemSelection(card);
                    return false;
                } else {
                    window.location.href = `/item/${card.dataset.id}`;
                }
            });
        }
        
        // For mobile: Long press to select
        if (isMobile) {
            // Prevent context menu on long press
            card.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                return false;
            });
            
            // Touch start - begin timer for long press
            card.addEventListener('touchstart', function(e) {
                // Store initial touch position
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                isLongPressing = false;
                
                longPressTimer = setTimeout(() => {
                    // This is a long press
                    isLongPressing = true;
                    card.classList.add('long-pressing');
                    
                    // First long press enables selection mode
                    if (!selectionMode) {
                        enableSelectionMode();
                    }
                    
                    // Always select the item that was long-pressed
                    const itemId = card.dataset.id;
                    card.classList.add('selected');
                    checkbox.checked = true;
                    selectedItems.add(itemId);
                    updateSelectionToolbar();
                }, longPressDuration);
            }, { passive: true });
            
            // Touch move - detect if user is scrolling
            card.addEventListener('touchmove', function(e) {
                if (!longPressTimer) return;
                
                // Calculate distance moved
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                const deltaX = Math.abs(touchX - touchStartX);
                const deltaY = Math.abs(touchY - touchStartY);
                
                // If significant movement, cancel long press (user is probably scrolling)
                if (deltaX > 10 || deltaY > 10) {
                    clearTimeout(longPressTimer);
                    card.classList.remove('long-pressing');
                }
            }, { passive: true });
            
            // Touch end - clear timer and handle selection
            card.addEventListener('touchend', function(e) {
                clearTimeout(longPressTimer);
                card.classList.remove('long-pressing');
                
                // Calculate if this was a tap or a scroll end
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                const deltaX = Math.abs(touchEndX - touchStartX);
                const deltaY = Math.abs(touchEndY - touchStartY);
                
                // If in selection mode and this was a precise tap (not a scroll)
                if (selectionMode && deltaX < 10 && deltaY < 10) {
                    e.preventDefault();
                    
                    // If not the result of a long press that just ended
                    if (!isLongPressing) {
                        toggleItemSelection(card);
                    }
                }
                
                // Reset long pressing flag
                isLongPressing = false;
                
                // If not in selection mode, allow normal navigation
                if (!selectionMode && deltaX < 10 && deltaY < 10) {
                    window.location.href = `/item/${card.dataset.id}`;
                }
            });
        }
    });
    
    // Handle "Select Items" button
    selectAllBtn.addEventListener('click', function() {
        if (!selectionMode) {
            // Enable selection mode
            enableSelectionMode();
        } else {
            // If already in selection mode, toggle between select all and deselect all
            const isAllSelected = selectedItems.size === itemCards.length;
            
            if (isAllSelected) {
                // Deselect all
                selectCheckboxes.forEach(checkbox => {
                    const card = checkbox.closest('.item-card');
                    const itemId = card.dataset.id;
                    checkbox.checked = false;
                    card.classList.remove('selected');
                    selectedItems.delete(itemId);
                });
            } else {
                // Select all
                selectCheckboxes.forEach(checkbox => {
                    const card = checkbox.closest('.item-card');
                    const itemId = card.dataset.id;
                    checkbox.checked = true;
                    card.classList.add('selected');
                    selectedItems.add(itemId);
                });
            }
            
            updateSelectionToolbar();
        }
    });
    
    // Handle cancel selection button
    cancelSelectionBtn.addEventListener('click', function() {
        exitSelectionMode();
    });
    
    // Listen for Escape key on desktop
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && selectionMode) {
            exitSelectionMode();
        }
    });
    
    // Toggle item selection helper function
    function toggleItemSelection(card) {
        const itemId = card.dataset.id;
        const checkbox = card.querySelector('.item-select');
        
        if (card.classList.contains('selected')) {
            card.classList.remove('selected');
            checkbox.checked = false;
            selectedItems.delete(itemId);
        } else {
            card.classList.add('selected');
            checkbox.checked = true;
            selectedItems.add(itemId);
        }
        
        updateSelectionToolbar();
    }
    
    // Function to enable selection mode
    function enableSelectionMode() {
        selectionMode = true;
        itemCards.forEach(card => {
            card.classList.add('selection-mode');
        });
        selectAllBtn.innerHTML = '<i class="fas fa-check-square"></i> Select All';
        updateSelectionToolbar();
    }
    
    // Function to exit selection mode
    function exitSelectionMode() {
        selectionMode = false;
        selectedItems.clear();
        itemCards.forEach(card => {
            card.classList.remove('selection-mode', 'selected');
            const checkbox = card.querySelector('.item-select');
            checkbox.checked = false;
            checkbox.classList.remove('visible');
        });
        selectAllBtn.innerHTML = '<i class="fas fa-check-square"></i> Select Items';
        selectionToolbar.classList.remove('active');
    }
    
    // Handle bulk actions
    repostSelectedBtn.addEventListener('click', function() {
        if (selectedItems.size > 0) {
            if (confirm(`Are you sure you want to repost ${selectedItems.size} item(s)?`)) {
                submitBulkAction('repost');
            }
        }
    });
    
    toggleSoldBtn.addEventListener('click', function() {
        if (selectedItems.size > 0) {
            if (confirm(`Are you sure you want to toggle the sold status of ${selectedItems.size} item(s)?`)) {
                submitBulkAction('toggle_sold');
            }
        }
    });
    
    deleteSelectedBtn.addEventListener('click', function() {
        if (selectedItems.size > 0) {
            if (confirm(`Are you sure you want to delete ${selectedItems.size} item(s)? This action cannot be undone.`)) {
                submitBulkAction('delete');
            }
        }
    });
    
    // Update selection toolbar visibility and count
    function updateSelectionToolbar() {
        if (selectedItems.size > 0) {
            selectionToolbar.classList.add('active');
            selectionCount.textContent = `${selectedItems.size} item${selectedItems.size === 1 ? '' : 's'} selected`;
            
            // Update Select All button text if needed
            if (selectedItems.size === itemCards.length && selectionMode) {
                selectAllBtn.innerHTML = '<i class="fas fa-times-circle"></i> Deselect All';
            } else if (selectionMode) {
                selectAllBtn.innerHTML = '<i class="fas fa-check-square"></i> Select All';
            }
        } else {
            selectionToolbar.classList.remove('active');
            
            // If no items selected but still in selection mode
            if (selectionMode) {
                selectAllBtn.innerHTML = '<i class="fas fa-check-square"></i> Select All';
            }
        }
    }
    
    // Submit bulk action form
    function submitBulkAction(action) {
        selectedItemsInput.value = Array.from(selectedItems).join(',');
        actionInput.value = action;
        bulkActionForm.action = `/bulk-action/${action}/`;
        bulkActionForm.submit();
    }
});