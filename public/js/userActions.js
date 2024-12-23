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
            if (data.redirect) {
                window.location.href = data.redirect;
            } else {
                window.location.reload();
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            alert(error.message || "An error occurred. Please try again.");
        });
}
