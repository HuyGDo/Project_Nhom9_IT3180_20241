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
app.engine(
    "hbs",
    engine({
        extname: ".hbs",
        defaultLayout: "default",
        helpers: {
            ...hbsHelpers,
            sum: (a, b) => a + b,
            eq: (a, b) => a === b,
        },
    }),
);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on: http://localhost:${PORT}`);
});
