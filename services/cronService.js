// const cron = require('node-cron');
// const notificationService = require('./notificationService');
// const emailService = require('./emailService');
// const { generateEmailContent } = require('../utils/emailGeneration');

// //Pure function to create email
// const createEmailMessage = (trendingRecipes, trendingBlogs) => ({
//     subject: 'Weekly summary of trending content',
//     htmlContent: generateEmailContent(trendingRecipes, trendingBlogs)
// })

// //Schedule a cron job to run weekly (e.g: Monday 8:00 am)
// const publishWeeklyEmail = async () => {
//     try {
//         // Fetch trending content
//         const { trendingRecipes, trendingBlogs } = await notificationService.getWeeklyTrendingNotifications();

//         // Create email message
//         const message = createEmailMessage(trendingRecipes, trendingBlogs);

//         // Publish to RabbitMQ

//         console.log('Published weekly summary to rabbitmq');
//     } catch (error) {
//         console.error('Error in weekly cron job:', error);
//     }
// };

// // Function to setup the cron job
// const setupWeeklyEmailCronJob = () => {
//     // Schedule the job using a pure function
//     cron.schedule('0 8 * * MON', publishWeeklyEmail);
// };

// module.exports = {
//     setupWeeklyEmailCronJob,
//     createEmailMessage,
//     publishWeeklyEmail
// };
