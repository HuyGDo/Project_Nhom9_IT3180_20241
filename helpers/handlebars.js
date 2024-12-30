module.exports = {
    formatDate: function (date) {
        const d = new Date(date);
        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    },
    add: (a, b) => {
        return Number(a) + Number(b);
    },
    limit: function (arr, limit) {
        if (!Array.isArray(arr)) {
            return [];
        }
        return arr.slice(0, limit);
    },
    eq: function (a, b) {
        return a === b;
    },
    generateNotificationLink: function (notification) {
        if (!notification || !notification.content_id) {
            return "#";
        }

        // Helper function to get slug safely
        const getSlug = (content) => {
            if (typeof content === "string") return content;
            return content.slug || content._id || "";
        };

        switch (notification.notification_type) {
            case "follow":
                return `/users/${notification.content_id._id || ""}`;
            case "new_post":
                if (notification.content_type === "Blog") {
                    return `/blogs/${getSlug(notification.content_id)}`;
                } else if (notification.content_type === "Recipe") {
                    return `/recipes/${getSlug(notification.content_id)}`;
                }
                return "#";
            case "like":
            case "comment":
                if (notification.content_type === "Blog") {
                    return `/blogs/${getSlug(notification.content_id)}`;
                } else if (notification.content_type === "Recipe") {
                    return `/recipes/${getSlug(notification.content_id)}`;
                }
                return "#";
            default:
                return "#";
        }
    },
};
