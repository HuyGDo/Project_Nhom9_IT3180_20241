const nodemailer = require('nodemailer');

//Create a transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Set this in your environment variables
        user: process.env.EMAIL_PASSWORD
    }
});

// Function to send an email with the given subject and HTML content
module.exports.sendNotificationEmail = async (recipientEmail, subject, htmlContent) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: subject,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${recipientEmail}`)
    } catch (error) {
        console.error('Error sending email: ', error);
        throw error; // Optionally handle retry logic here if needed --> Required later
    }
};

