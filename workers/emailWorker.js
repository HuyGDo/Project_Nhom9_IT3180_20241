// emailWorker.js - Consumes Email Jobs from RabbitMQ

const rabbitmqService = require('../services/rabbitmqService');
const emailService = require('../services/emailService');
const User = require('../models/User');

//function to process emails
const processEmailJob = async (message) => {
    try {
        // Parse the message to get the subject and HTML content
        const { subject, htmlContent } = JSON.parse(messgae.content.toString());

        // Fetch all users who should receive weekly emails
        const users = await User.find(); // Adjust for users opted-in for emails --> Adjust later

        for(const user in users){
            await emailService.sendNotificationEmail(user.email, subject, htmlContent);
        }

        console.log('Weekly summary emails sent successfully');
    } catch (error) {
        console.error('Error sending weekly summary emails:', error);
    }
}

//Consume messages from RabbitMQ emailQueue
rabbitmqService.consume('emailQueue', processEmailJob);