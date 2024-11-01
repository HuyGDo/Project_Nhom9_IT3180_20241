require("dotenv").config();
const { PORT, globalVariables } = require("./config/configuration");
const express = require("express");
const path = require("path");
const { engine } = require("express-handlebars");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { setupWeeklyEmailCronJob } = require('./services/cronService');
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

app.set("views", path.join(__dirname, "views"));

/* Flash & Session */
app.use(
    session({
        secret: "anysecret",
        saveUninitialized: true,
        resave: true,
    }),
);
app.use(flash());

/* Setup View Engine */
app.engine(
    "hbs",
    engine({
        extname: ".hbs",
        defaultLayout: "default",
        helpers: {
            sum: (a, b) => a + b,
        },
    }),
);
app.set("view engine", "hbs");

/* Use Global Variables */
app.use(globalVariables);

/* Method Override Middleware*/
app.use(methodOverride("_method"));

/* Cookies Parser Middleware*/
app.use(cookieParser());

/* Routes init */
const route = require("./routes/siteRouters");
route(app);

/* Initialize cronjob */
setupWeeklyEmailCronJob();

app.listen(PORT, () => {
    console.log(`Server is running on: http://localhost:${PORT}`);
});
