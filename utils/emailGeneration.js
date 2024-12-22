const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const generateEmailContent = (trendingRecipes, trendingBlogs) => {
    const templatePath = path.join(__dirname, '../views/notification/emailTemplate.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateSource);
    const data = { trendingRecipes, trendingBlogs };
    return template(data);
};

module.exports = { generateEmailContent };