const express = require('express');
const exphbs = require('express-handlebars'); // Import exphbs
const path = require('path'); // Import the path module for setting the views path
const app = express();
const db = require('./config/database'); // Import to database config
const routesClient = require('./routes/client/indexRoute'); // Import to route

// Connect DB
db.connect();

// Set up Handlebars as the view engine
app.engine(
    'hbs',
    exphbs.engine({
        defaultLayout: 'main',
        extname: 'hbs',
    }),
);
app.set('view engine', 'hbs');

// Set the views directory (optional, if not in the default location)
app.set('views', path.join(__dirname, 'views'));

// Middleware for serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes init
routesClient(app);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
