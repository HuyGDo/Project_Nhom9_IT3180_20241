document.addEventListener("DOMContentLoaded", function () {
    const notificationsToggle = document.getElementById("notificationsToggle");
    const notificationsDropdown = document.getElementById("notificationsDropdown");
    const notificationCount = document.getElementById("notificationCount");
    let notifications = [];

    if (notificationsToggle && notificationsDropdown) {
        // Toggle dropdown and fetch notifications
        notificationsToggle.addEventListener("click", async function (e) {
            e.stopPropagation();
            notificationsDropdown.classList.toggle("show");

            if (notificationsDropdown.classList.contains("show")) {
                await fetchNotifications();
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", function (e) {
            if (
                !notificationsDropdown.contains(e.target) &&
                !notificationsToggle.contains(e.target)
            ) {
                notificationsDropdown.classList.remove("show");
            }
        });
    }

    // Fetch notifications
    async function fetchNotifications() {
        try {
            const response = await fetch("/notifications/list", {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            notifications = data.notifications;

            // Log notifications data
            console.log("Fetched notifications:", notifications);

            renderNotifications();
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    }

    // Update notification count with logging
    async function updateNotificationCount() {
        try {
            const response = await fetch("/notifications/unread-count", {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            console.log("Unread notification count:", data.count);
            notificationCount.textContent = data.count;
            notificationCount.style.display = data.count > 0 ? "flex" : "none";
        } catch (error) {
            console.error("Error updating notification count:", error);
        }
    }

    // Render notifications in dropdown
    function renderNotifications() {
        const notificationsList = document.querySelector(".notification-dropdown__list");
        if (!notificationsList) return;

        if (!notifications.length) {
            notificationsList.innerHTML = `
                <div class="notification-dropdown__empty">
                    <img src="/assets/img/no-notifications.svg" alt="No notifications">
                    <h3>No notifications yet</h3>
                    <p>We'll notify you when something important happens</p>
                </div>
            `;
            return;
        }

        const notificationItems = notifications.map(notification => {
            const contentUrl = notification.content_id ? 
                `/${notification.content_type.toLowerCase()}s/${notification.content_id.slug}` : 
                '#';

            return `
                <a href="${contentUrl}" 
                   class="notification-dropdown__item ${!notification.is_read ? 'notification-dropdown__item--unread' : ''}"
                   data-notification-id="${notification._id}">
                    <img src="${notification.content_id?.profile_picture || '/assets/img/avatar.jpg'}" 
                         alt="Notification image" 
                         class="notification-dropdown__avatar">
                    <div class="notification-dropdown__content">
                        <p class="notification-dropdown__message">${notification.message}</p>
                        <span class="notification-dropdown__time">${formatDate(notification.created_at)}</span>
                    </div>
                </a>
            `;
        }).join('');

        notificationsList.innerHTML = notificationItems;

        // Add click handlers for notifications
        notificationsList.querySelectorAll('.notification-dropdown__item').forEach(item => {
            item.addEventListener('click', async function(e) {
                const notificationId = this.dataset.notificationId;
                if (!this.classList.contains('notification-dropdown__item--read')) {
                    try {
                        await fetch(`/notifications/${notificationId}/read`, {
                            method: 'PUT',
                            headers: getAuthHeaders()
                        });
                        this.classList.remove('notification-dropdown__item--unread');
                        updateNotificationCount();
                    } catch (error) {
                        console.error('Error marking notification as read:', error);
                    }
                }
            });
        });
    }

    // Mark single notification as read
    async function markAsRead(notificationId) {
        try {
            const response = await fetch(`/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            
            if (data.success) {
                // Update UI
                const notificationElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
                if (notificationElement) {
                    // Remove unread classes
                    notificationElement.classList.remove('notification-card--unread');
                    notificationElement.classList.remove('notification-dropdown__item--unread');
                    
                    // Remove unread badge if it exists
                    const unreadBadge = notificationElement.querySelector('.notification-card__badge');
                    if (unreadBadge) {
                        unreadBadge.remove();
                    }

                    // Get the actions container
                    const actionsContainer = notificationElement.querySelector('.notification-card__actions');
                    if (actionsContainer) {
                        // Remove the mark as read button
                        const markAsReadBtn = actionsContainer.querySelector('.mark-as-read');
                        if (markAsReadBtn) {
                            markAsReadBtn.remove();
                        }
                    }

                    // Remove the highlight/background color
                    notificationElement.style.backgroundColor = 'transparent';
                }

                // Update notification count in header
                if (notificationCount) {
                    const currentCount = parseInt(notificationCount.textContent) || 0;
                    const newCount = Math.max(0, currentCount - 1);
                    notificationCount.textContent = newCount;
                    notificationCount.style.display = newCount > 0 ? "flex" : "none";
                }

                // Update count in page title if it exists
                const pageCountElement = document.querySelector('.notification-page__count');
                if (pageCountElement) {
                    const totalCount = parseInt(pageCountElement.textContent) || 0;
                    pageCountElement.textContent = `${totalCount} notifications`;
                }

                // Hide the mark all as read button if no more unread notifications
                const unreadNotifications = document.querySelectorAll('.notification-card--unread');
                const markAllAsReadBtn = document.getElementById('markAllAsRead');
                if (markAllAsReadBtn && unreadNotifications.length === 0) {
                    markAllAsReadBtn.style.display = 'none';
                }
            }
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    }

    // Mark all notifications as read
    async function markAllAsRead() {
        try {
            const response = await fetch('/notifications/mark-all-read', {
                method: 'PUT',
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            
            if (data.success) {
                // Update UI for all unread notifications
                document.querySelectorAll('.notification-card--unread').forEach(notification => {
                    // Remove unread classes
                    notification.classList.remove('notification-card--unread');
                    notification.classList.remove('notification-dropdown__item--unread');
                    
                    // Remove unread badge
                    const unreadBadge = notification.querySelector('.notification-card__badge');
                    if (unreadBadge) {
                        unreadBadge.remove();
                    }

                    // Get the actions container
                    const actionsContainer = notification.querySelector('.notification-card__actions');
                    if (actionsContainer) {
                        // Remove the mark as read button
                        const markAsReadBtn = actionsContainer.querySelector('.mark-as-read');
                        if (markAsReadBtn) {
                            markAsReadBtn.remove();
                        }
                    }

                    // Remove the highlight/background color
                    notification.style.backgroundColor = 'transparent';
                });

                // Update notification count in header
                if (notificationCount) {
                    notificationCount.textContent = "0";
                    notificationCount.style.display = "none";
                }

                // Hide the mark all as read button
                const markAllAsReadBtn = document.getElementById('markAllAsRead');
                if (markAllAsReadBtn) {
                    markAllAsReadBtn.style.display = 'none';
                }

                // Update the page title count
                const pageCountElement = document.querySelector('.notification-page__count');
                if (pageCountElement) {
                    const totalCount = document.querySelectorAll('.notification-card').length;
                    pageCountElement.textContent = `${totalCount} notifications`;
                }
            }
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    }

    // Add click handlers for mark as read buttons
    notificationsDropdown.addEventListener('click', async function(e) {
        // Handle single notification mark as read
        if (e.target.classList.contains('mark-as-read') && notificationsDropdown.contains(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            
            const notificationId = e.target.dataset.notificationId;
            if (notificationId) {
                await markAsRead(notificationId);
            }
        }
        
        // Handle mark all as read
        if (e.target.id === 'markAllAsReadBtn' && notificationsDropdown.contains(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            await markAllAsRead();
        }
    });

    // Initial count update
    updateNotificationCount();

    // Update count periodically
    setInterval(updateNotificationCount, 60000); // Update every minute
});

// Helper function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString();
}

function getAuthHeaders() {
    const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("jwt="))
        ?.split("=")[1];

    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
}
