const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports.requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    // check if json web token exits & is verified
    if (token) {
        jwt.verify(token, "bussin cookin secret", (err, decodeToken) => {
            if (err) {
                console.log(err.message);
                res.redirect("/sign-in");
            } else {
                console.log(decodeToken);
                next();
            }
        });
    } else {
        res.redirect("/sign-in");
    }
};

module.exports.checkUser = (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        jwt.verify(token, "bussin cookin secret", async (err, decodeToken) => {
            if (err) {
                console.log(err.message);
                res.locals.user = null;
            } else {
                console.log(decodeToken);
                let user = await User.findById(decodeToken._id);
                res.locals.user = user;
                next();
            }
        });
    } else {
        res.locals.user = null;
        next();
    }
};
