const generateNotificationLink = (notification) => {
    if (!notification || !notification.content_id) {
        return '#';
    }

    const contentType = notification.content_type.toLowerCase();
    const slug = notification.content_id.slug;

    switch (contentType) {
        case 'recipe':
            return `/recipes/${slug}`;
        case 'blog':
            return `/blogs/${slug}`;
        default:
            return '#';
    }
};

const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    
    try {
        const now = new Date();
        const past = new Date(dateStr);
        
        if (isNaN(past.getTime())) {
            console.error('Invalid date:', dateStr);
            return '0m ago';
        }

        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) {
            return 'just now';
        }

        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays === 1) {
            return 'yesterday';
        }
        if (diffInDays < 7) {
            return `${diffInDays}d ago`;
        }

        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInWeeks < 4) {
            return `${diffInWeeks}w ago`;
        }

        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) {
            return `${diffInMonths}mo ago`;
        }

        const diffInYears = Math.floor(diffInDays / 365);
        return `${diffInYears}y ago`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
};

module.exports = {
    generateNotificationLink,
    formatTimeAgo
};
