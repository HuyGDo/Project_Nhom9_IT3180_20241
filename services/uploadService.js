const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Tạo các thư mục upload nếu chưa tồn tại
const createUploadDirs = () => {
    const dirs = [
        path.join(__dirname, "../uploads/avatars"),
        path.join(__dirname, "../uploads/recipes"),
    ];

    dirs.forEach((dir) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createUploadDirs();

// Cấu hình storage cho multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Xác định thư mục dựa vào loại upload
        const uploadType = req.uploadType || "recipes"; // mặc định là recipes
        const uploadPath = path.join(__dirname, `../uploads/${uploadType}`);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

// Check file type
const fileFilter = (req, file, cb) => {
    console.log("Processing file:", file);

    // Kiểm tra mimetype thay vì extension
    if (file.mimetype.startsWith("image/")) {
        return cb(null, true);
    }

    cb(new Error("Please upload only image files (JPEG, PNG, GIF)"));
};

// Cấu hình multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5, // 5MB limit
    },
    fileFilter: fileFilter,
});

module.exports = {
    uploadAvatar: (req, res, next) => {
        console.log("uploadAvatar middleware called");
        req.uploadType = "avatars";
        return upload.single("profile_picture")(req, res, (err) => {
            if (err) {
                console.error("Upload error:", err);
            }
            console.log("File after upload:", req.file);
            next(err);
        });
    },
    uploadRecipeImage: (req, res, next) => {
        req.uploadType = "recipes";
        return upload.single("recipe-image")(req, res, next);
    },
};
