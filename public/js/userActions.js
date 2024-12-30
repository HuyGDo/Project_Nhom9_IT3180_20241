function handleFollowAction(action, userId, event) {
    // Prevent the card click event
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    fetch(`/users/${userId}/${action}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "same-origin",
    })
        .then((response) => {
            if (response.url.includes("/sign-in")) {
                const returnUrl = encodeURIComponent(window.location.pathname);
                window.location.href = `/sign-in?returnUrl=${returnUrl}`;
                return;
            }

            if (!response.ok) {
                return response.json().then((err) => {
                    throw err;
                });
            }
            return response.json();
        })
        .then((data) => {
            if (data.success) {
                // Get the button that was clicked
                const button = document.querySelector(`button[onclick*="${userId}"]`);
                if (button) {
                    if (action === "follow") {
                        // Change to unfollow
                        button.setAttribute(
                            "onclick",
                            `handleFollowAction('unfollow', '${userId}', event)`,
                        );
                        button.textContent = "Unfollow";
                        button.classList.remove("btn--primary");
                        button.classList.add("btn--outline");
                    } else {
                        // Change to follow
                        button.setAttribute(
                            "onclick",
                            `handleFollowAction('follow', '${userId}', event)`,
                        );
                        button.textContent = "Follow";
                        button.classList.remove("btn--outline");
                        button.classList.add("btn--primary");
                    }
                }
            } else {
                throw new Error(data.message);
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            alert(error.message || "An error occurred. Please try again.");
        });
}
