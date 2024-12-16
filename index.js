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

/* Method Override Middleware*/
app.use(methodOverride("_method"));

/* Use Global Variables */
app.use(globalVariables);

/* Routes init */
const route = require("./routes/siteRouters");
route(app);

app.listen(PORT, () => {
    console.log(`Server is running on: http://localhost:${PORT}`);
});
