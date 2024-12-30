document.addEventListener('DOMContentLoaded', function() {
    // Handle mark as read for individual notifications
    document.querySelectorAll('.mark-as-read').forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            const notificationId = this.dataset.notificationId;
            const card = document.querySelector(`.notification-card[data-notification-id="${notificationId}"]`);

            try {
                const response = await fetch(`/notifications/${notificationId}/read`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders()
                    }
                });

                if (response.ok) {
                    // Remove unread styling
                    card.classList.remove('notification-card--unread');
                    // Remove the mark as read button
                    this.remove();
                    // Remove the unread status badge
                    card.querySelector('.notification-card__status')?.remove();
                    // Update notification count in header if it exists
                    updateNotificationCount();
                }
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        });
    });

    // Handle mark all as read
    const markAllButton = document.getElementById('markAllAsRead');
    if (markAllButton) {
        markAllButton.addEventListener('click', async function() {
            try {
                const response = await fetch('/notifications/mark-all-read', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders()
                    }
                });

                if (response.ok) {
                    // Remove unread styling from all cards
                    document.querySelectorAll('.notification-card--unread').forEach(card => {
                        card.classList.remove('notification-card--unread');
                    });
                    // Remove all mark as read buttons
                    document.querySelectorAll('.mark-as-read').forEach(button => {
                        button.remove();
                    });
                    // Remove all unread status badges
                    document.querySelectorAll('.notification-card__status').forEach(badge => {
                        badge.remove();
                    });
                    // Update notification count in header
                    updateNotificationCount();
                    // Hide the mark all as read button
                    this.style.display = 'none';
                }
            } catch (error) {
                console.error('Error marking all notifications as read:', error);
            }
        });
    }

    // Helper function to update notification count in header
    async function updateNotificationCount() {
        try {
            const response = await fetch('/notifications/unread-count', {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            
            // Update count in header if the element exists
            const countElement = document.querySelector('#notificationCount');
            if (countElement) {
                countElement.textContent = data.count || '';
                countElement.style.display = data.count ? 'block' : 'none';
            }
        } catch (error) {
            console.error('Error updating notification count:', error);
        }
    }

    function getAuthHeaders() {
        return {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
        };
    }
});
