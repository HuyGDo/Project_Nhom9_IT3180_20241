// index.js
require("dotenv").config();
const { PORT, globalVariables } = require("./config/configuration");
const express = require("express");
const path = require("path");
const { engine } = require("express-handlebars");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");

const app = express();
const authMiddleware = require("./middleware/authMiddleware");
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
            sum: (a, b) => a + b,
            eq: (a, b) => a === b, // Added eq helper
        },
    }),
);
app.set("view engine", "hbs");

/* Cookies Parser Middleware*/
app.use(cookieParser());

/* Flash & Session */
app.use(
    session({
        secret: process.env.SESSION_SECRET || "anysecret",
        saveUninitialized: true,
        resave: true,
    }),
);
app.use(flash());

app.use(passport.initialize());
app.use(passport.session()); // Ensure this is used if session-based

/* Method Override Middleware*/
app.use(methodOverride("_method"));

/* Use Global Variables */
app.use(globalVariables);

app.use(authMiddleware.setCurrentUser);

/* Routes init */
const route = require("./routes/siteRouters");
route(app);

app.listen(PORT, () => {
    console.log(`Server is running on: http://localhost:${PORT}`);
});
