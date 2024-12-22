const nodemailer = require("nodemailer");
const handlebars = require("handlebars");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

module.exports = {
    async sendNotificationEmail(to, subject, htmlContent) {
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM,
                to,
                subject,
                html: htmlContent,
            });
            console.log(`Email sent to ${to}`);
        } catch (error) {
            console.error("Error sending email:", error);
            throw error;
        }
    },
};
