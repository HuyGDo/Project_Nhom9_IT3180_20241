const Notification = require('../models/Notification');
const rabbitmqService = require('./rabbitmqService');
const Recipe = require('../models/Recipe');
const Blog = require('../models/Blog');

module.exports.createNotification = async (notificationData) => {
    const notification = new Notification(notificationData);
    await notification.save();

    // Publish message to RabbitMQ for further processing
    rabbitmqService.publish('notificationQueue', notificationData);

    return notification;
};

module.exports.getUnreadNotifications = async (userId) => {
    return Notification.find({ recipient_id: userId, is_read: false });
};

module.exports.markAsRead = async (notificationId) => {
    return Notification.findByIdAndUpdate(notificationId, { is_read: true }, { new: true });
};

module.exports.getWeeklyTrendingNotifications = async () => {
    try {
        // Get the date for 7 days ago
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        //Aggregate trending recipes
        const trendingRecipes = await Recipe.aggregate([
            {
                // Filter recipes created or updated in the past week
                $match: {
                    updatedAt: { $gte: oneWeekAgo }
                }
            },
            {
                // Unwind the reviews (comments) array to count total comments
                $unwind: {
                    path: "$reviews",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                // Group by recipe and count the number of reviews (comments) and likes
                $group: {
                    _id: "$_id",
                    title: { $first: "$recipe_title" },
                    likes: { $sum: { $size: { $ifNull: ["$likes", []] } } },
                    comments: { $sum: 1 },
                    totalInteractions: {
                         $sum: {
                             $add: [{
                                $size: {
                                    $ifNull: ["$likes", []]
                                }}
                            , 1]
                        }
                    }
                }
            },
            {
                //Limit to top 5
                $limit: 5
            }
        ]);

        //Aggregate trending blogs
        const trendingBlogs = await Blog.aggregate([
            {
                //Filter blog
                $match: {
                    updatedAt: { $gte: oneWeekAgo } 
                }
            },
            {
                // Unwind upvotes and downvotes to count total interactions
                $unswind: {
                    path: "$upvotes",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $unwind: {
                    path: "$downvotes",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                // Group by blog and count upvotes, downvotes, and comments
                $group: {
                    _id: "$_id",
                    title: { $first: "$blog_title" },
                    upvotes: { $sum: 1 },
                    downvotes: { $sum: 1 },
                    totalInteractions: { $sum: { add: [1, 1] } } //upvotes + downvotes
                }
            },
            {
                //Sort blogs by totalInteractions
                $sort: { totalInteractions: -1 }
            },
            {
                //Limit to top 5 trending
                $limit: 5
            }
        ]);

        //Return the trending
        return {
            trendingRecipes,
            trendingBlogs
        }
    } catch (error) {
        console.error('Error querying trending content: ', error);
        throw error;
    }
}