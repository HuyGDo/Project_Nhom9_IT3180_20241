function handleFollowAction(action, userId) {
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
                    // Update button text and onclick handler based on new following status
                    if (data.isFollowing) {
                        button.setAttribute(
                            "onclick",
                            `handleFollowAction('unfollow', '${userId}')`,
                        );
                        button.textContent = "Unfollow";
                    } else {
                        button.setAttribute("onclick", `handleFollowAction('follow', '${userId}')`);
                        button.textContent = "Follow";
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
