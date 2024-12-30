document.addEventListener("DOMContentLoaded", function () {
    console.log("Notification page script loaded");

    // Handle mark as read for individual notifications
    document.querySelectorAll(".notification-card .mark-as-read").forEach((button) => {
        button.addEventListener("click", async function (e) {
            console.log("Mark as read button clicked"); // Added log to check if listener is triggered
            e.preventDefault();
            e.stopPropagation(); // Stop event from bubbling up

            const notificationId = this.dataset.notificationId;
            const notificationCard = this.closest(".notification-card");

            if (!notificationId || !notificationCard) {
                console.error("Missing notification ID or notification card element");
                return;
            }

            try {
                const response = await fetch(`/notifications/${notificationId}/read`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (response.ok) {
                    console.log("Successfully marked notification as read");

                    // Remove unread class and apply read styles
                    notificationCard.classList.remove("notification-card--unread");
                    notificationCard.classList.add("notification-card--read");

                    // Remove the "Unread" badge
                    const unreadBadge = notificationCard.querySelector(".notification-card__badge");
                    if (unreadBadge) {
                        unreadBadge.remove();
                    }

                    // Ensure only one "View Details" button exists
                    const actionsContainer = notificationCard.querySelector(
                        ".notification-card__actions",
                    );
                    if (actionsContainer) {
                        const markAsReadButton = actionsContainer.querySelector(".mark-as-read");
                        if (markAsReadButton) {
                            markAsReadButton.remove();
                        }

                        let viewDetailsButton = actionsContainer.querySelector(".btn-primary");
                        if (!viewDetailsButton) {
                            viewDetailsButton = document.createElement("a");
                            viewDetailsButton.href = `/notification/${notificationId}`;
                            viewDetailsButton.className = "btn btn-primary";
                            viewDetailsButton.textContent = "View Details";
                            actionsContainer.appendChild(viewDetailsButton);
                        }
                    }

                    // Update notification count
                    const countElement = document.querySelector(".notification-page__count");
                    if (countElement) {
                        const currentCount = parseInt(countElement.textContent);
                        if (!isNaN(currentCount)) {
                            countElement.textContent = `${currentCount - 1} notifications`;
                        }
                    }

                    // If no more unread notifications, hide the mark all button
                    const unreadNotifications = document.querySelectorAll(
                        ".notification-card--unread",
                    );
                    const markAllBtn = document.querySelector("#markAllAsRead");
                    if (unreadNotifications.length === 0 && markAllBtn) {
                        markAllBtn.style.display = "none";
                    }
                } else {
                    console.error("Failed to mark notification as read");
                }
            } catch (error) {
                console.error("Error marking notification as read:", error);
            }
        });
    });

    // Handle "Mark All as Read" functionality
    const markAllAsReadButton = document.querySelector("#markAllAsRead");
    if (markAllAsReadButton) {
        markAllAsReadButton.addEventListener("click", async function (e) {
            console.log("Mark All as Read button clicked");
            e.preventDefault();

            const unreadNotifications = document.querySelectorAll(".notification-card--unread");
            if (unreadNotifications.length === 0) {
                console.log("No unread notifications to mark as read");
                return;
            }

            try {
                const notificationIds = Array.from(unreadNotifications).map(
                    (notification) => notification.dataset.notificationId,
                );

                // Send request to mark all notifications as read
                const response = await fetch("/notifications/mark-all-read", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ notificationIds }),
                });

                if (response.ok) {
                    console.log("Successfully marked all notifications as read");

                    // Update all unread notification cards
                    unreadNotifications.forEach((notificationCard) => {
                        notificationCard.classList.remove("notification-card--unread");
                        notificationCard.classList.add("notification-card--read");

                        const unreadBadge = notificationCard.querySelector(
                            ".notification-card__badge",
                        );
                        if (unreadBadge) {
                            unreadBadge.remove();
                        }

                        const actionsContainer = notificationCard.querySelector(
                            ".notification-card__actions",
                        );
                        if (actionsContainer) {
                            const markAsReadButton =
                                actionsContainer.querySelector(".mark-as-read");
                            if (markAsReadButton) {
                                markAsReadButton.remove();
                            }

                            let viewDetailsButton = actionsContainer.querySelector(".btn-primary");
                            if (!viewDetailsButton) {
                                viewDetailsButton = document.createElement("a");
                                viewDetailsButton.href = `/notification/${notificationCard.dataset.notificationId}`;
                                viewDetailsButton.className = "btn btn-primary";
                                viewDetailsButton.textContent = "View Details";
                                actionsContainer.appendChild(viewDetailsButton);
                            }
                        }
                    });

                    // Update notification count
                    const countElement = document.querySelector(".notification-page__count");
                    if (countElement) {
                        countElement.textContent = "0 notifications";
                    }

                    // Hide the "Mark All as Read" button
                    markAllAsReadButton.style.display = "none";
                } else {
                    console.error("Failed to mark all notifications as read");
                }
            } catch (error) {
                console.error("Error marking all notifications as read:", error);
            }
        });
    }
});
