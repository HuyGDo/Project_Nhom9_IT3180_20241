// index.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const { engine } = require("express-handlebars");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const hbsHelpers = require("./helpers/handlebars");
const { formatTimeAgo, generateNotificationLink } = require('./helpers/notificationHelpers');
// const { setupWeeklyEmailCronJob } = require("./services/cronService");
const app = express();
/* Configure Mongoose */
const db = require("./config/db");
db.connect();

/* Configure express */
app.use(express.json());
app.use(
    express.urlencoded({
        extended: true,
    }),
);
app.use(express.static(path.join(__dirname, "public")));

// Set static file for uploads folder for uploading images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* View Engine Setup */
app.set("views", path.join(__dirname, "views"));
const hbs = engine({
    extname: ".hbs",
    defaultLayout: "default",
    partialsDir: path.join(__dirname, "views/partials"),
    helpers: {
        ...hbsHelpers,
        sum: (a, b) => a + b,
        eq: (a, b) => a === b,
        formatTimeAgo,
        generateNotificationLink
    },
});
app.engine("hbs", hbs);
app.set("view engine", "hbs");

/* Cookies Parser Middleware*/
app.use(cookieParser());

const authMiddleware = require("./middleware/authMiddleware");

// Add checkLoggedIn middleware after cookie-parser but before routes
app.use(authMiddleware.checkLoggedIn);

/* Flash & Session */
app.use(
    session({
        secret: process.env.SESSION_SECRET || "anysecret",
        saveUninitialized: true,
        resave: true,
    }),
);
app.use(flash());

/* Method Override Middleware*/
app.use(methodOverride("_method"));

/* Routes init */
const route = require("./routes/siteRouters");
route(app);

/* Initialize cronjob */
// setupWeeklyEmailCronJob();

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/uploads", express.static("public/uploads"));

const blogRouters = require("./routes/blogRouters");

app.use("/blogs", blogRouters);

const RecommendationService = require('./services/recommendationService');

// Khởi tạo recommendation service
async function initializeServices() {
    try {
        const isServiceRunning = await RecommendationService.checkService();
        if (isServiceRunning) {
            await RecommendationService.initialize();
            console.log('Recommendation service initialized successfully');
        } else {
            console.log('Recommendation service is not available');
        }
    } catch (error) {
        console.error('Failed to initialize recommendation service:', error.message);
        // Tiếp tục chạy server ngay cả khi recommendation service không hoạt động
    }
}

const notificationRouters = require("./routes/notificationRouters");


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on: http://localhost:${PORT}`);
    initializeServices();
});
