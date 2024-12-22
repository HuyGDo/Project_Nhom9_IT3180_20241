const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = {
    requireAuth: (req, res, next) => {
        const token = req.cookies.jwt;

        if (token) {
            jwt.verify(token, "bussin cookin secret", async (err, decodedToken) => {
                if (err) {
                    console.log(err.message);
                    res.redirect("/sign-in");
                } else {
                    console.log(decodedToken);
                    req.user = await User.findById(decodedToken._id);
                    next();
                }
            });
        } else {
            res.redirect("/sign-in");
        }
    },
    
    checkUser: (req, res, next) => {
        const token = req.cookies.jwt;

        if (token) {
            jwt.verify(token, "bussin cookin secret", async (err, decodedToken) => {
                if (err) {
                    console.log(err.message);
                    res.locals.user = null;
                    req.user = null;
                    next();
                } else {
                    console.log(decodedToken);
                    let user = await User.findById(decodedToken._id);
                    res.locals.user = user;
                    req.user = user;
                    next();
                }
            });
        } else {
            res.locals.user = null;
            req.user = null;
            next();
        }
    },

    // Thêm middleware mới vào object export
    requireAuthAPI: (req, res, next) => {
        const token = req.cookies.jwt;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để thực hiện chức năng này'
            });
        }

        jwt.verify(token, "bussin cookin secret", async (err, decodedToken) => {
            if (err) {
                return res.status(401).json({
                    success: false,
                    message: 'Phiên đăng nhập không hợp lệ'
                });
            }
            
            req.user = await User.findById(decodedToken._id);
            next();
        });
    }
};
