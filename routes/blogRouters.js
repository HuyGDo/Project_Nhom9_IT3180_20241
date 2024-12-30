const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogController");
const auth = require("../middleware/authMiddleware");
const multer = require("multer");
const { uploadBlogImage } = require("../services/uploadService");

// Setup multer for blog image uploads
const upload = multer({ dest: "uploads/blogs/" });

// Protected routes - đặt các specific routes trước
router.get("/create", auth.requireAuth, blogController.createBlog);
router.post("/store", auth.requireAuth, upload.single("blog-image"), blogController.storeBlog);

// Public routes - đặt các dynamic routes sau
router.get("/", blogController.showBlogs);
router.get("/:slug", blogController.showBlogDetail);
router.post("/:id/vote", auth.requireAuth, blogController.handleVote);
router.post("/:id/comment", auth.requireAuth, blogController.addComment);
router.get("/:id/edit", auth.requireAuth, blogController.editBlog);
router.put("/:id", auth.requireAuth, upload.single("blog-image"), blogController.updateBlog);

module.exports = router;
