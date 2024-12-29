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
            const response = await fetch("/notifications", {
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
        const dropdownContent = document.querySelector(".notification-dropdown");
        if (!dropdownContent) {
            console.log("Dropdown content element not found");
            return;
        }

        console.log("Number of notifications:", notifications.length);

        if (notifications.length === 0) {
            console.log("No notifications to display");
            dropdownContent.innerHTML = `
                <div class="notification-dropdown__empty">
                    <img src="/assets/img/no-notifications.svg" alt="No notifications">
                    <h3>No notifications yet</h3>
                    <p>We'll notify you when something interesting happens</p>
                </div>
            `;
            return;
        }

        // Log each notification being rendered
        notifications.forEach((notification, index) => {
            console.log(`Notification ${index + 1}:`, {
                id: notification._id,
                message: notification.message,
                contentType: notification.content_type,
                contentId: notification.content_id,
                isRead: notification.is_read,
                createdAt: notification.created_at,
                contentTypeData: notification.content_type_data,
            });
        });

        const notificationsList = notifications
            .map(
                (notification) => `
            <a href="${
                notification.content_id
                    ? `/${notification.content_type}s/${notification.content_id}`
                    : "#"
            }" 
               class="notification-dropdown__item ${
                   !notification.is_read ? "notification-dropdown__item--unread" : ""
               }"
               data-notification-id="${notification._id}">
                <img src="${notification.content_type_data?.image || "/assets/img/avatar.jpg"}" 
                     alt="Notification image" 
                     class="notification-dropdown__avatar">
                <div class="notification-dropdown__content">
                    <p class="notification-dropdown__message">${notification.message}</p>
                    <span class="notification-dropdown__time">${formatDate(
                        notification.created_at,
                    )}</span>
                </div>
            </a>
        `,
            )
            .join("");

        console.log("Rendered HTML:", notificationsList);

        dropdownContent.innerHTML = `
            <div class="notification-dropdown__header">
                <h3 class="notification-dropdown__title">Notifications</h3>
                ${
                    notifications.length > 0
                        ? '<button class="notification-dropdown__mark-all">Mark all as read</button>'
                        : ""
                }
            </div>
            <div class="notification-dropdown__list">
                ${notificationsList}
            </div>
        `;

        // Add event listeners for mark as read
        setupNotificationListeners();
    }

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

function setupNotificationListeners() {
    const notificationItems = document.querySelectorAll(".notification-dropdown__item");

    notificationItems.forEach((item) => {
        item.addEventListener("click", async function (e) {
            const notificationId = this.dataset.notificationId;

            try {
                // Mark as read when clicked
                await fetch(`/notifications/${notificationId}/read`, {
                    method: "PUT",
                    headers: getAuthHeaders(),
                });

                // Remove unread styling
                this.classList.remove("notification-dropdown__item--unread");

                // Update the notification count
                updateNotificationCount();
            } catch (error) {
                console.error("Error marking notification as read:", error);
            }
        });
    });
}
