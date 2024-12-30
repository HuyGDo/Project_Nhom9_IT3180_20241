const Blog = require("../models/Blog");
const notificationService = require("../services/notificationService");

// [GET] /blogs
module.exports.showBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ status: "published" })
            .populate("author", "username first_name last_name profile_picture")
            .sort({ createdAt: -1 })
            .lean();

        res.render("blogs/blog-browse", {
            layout: "default",
            title: "Browse Blogs",
            blogs,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// [GET] /blogs/:slug
module.exports.showBlogDetail = async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug })
            .populate("author", "username first_name last_name profile_picture")
            .populate("comments.user_id", "username first_name last_name profile_picture")
            .lean();

        if (!blog) {
            return res.render("default/404");
        }

        // Add userVoted info if user is logged in
        if (req.user) {
            const userVote = blog.userVotes.find(
                (vote) => vote.user.toString() === req.user._id.toString(),
            );
            blog.userVoted = {
                up: userVote?.voteType === "up",
                down: userVote?.voteType === "down",
            };
        }

        // Increment view count
        await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });

        // Check if the logged-in user is following the blog author
        const isFollowing = req.user ? req.user.following.includes(blog.author._id) : false;

        res.render("blogs/blog-detail", {
            layout: "default",
            title: blog.title,
            blog,
            isAuthenticated: !!req.user,
            isFollowing,
            user: req.user,
        });
    } catch (error) {
        console.error(error);
        res.render("default/404");
    }
};

// [GET] /blogs/create
module.exports.createBlog = (req, res) => {
    res.render("blogs/blog-create", {
        layout: "default",
        title: "Create Blog",
    });
};

// [POST] /blogs/store
module.exports.storeBlog = async (req, res) => {
    try {
        const blogData = {
            author: req.user._id,
            title: req.body.title,
            content: req.body.content,
            description: req.body.description,
            category: req.body.category,
            tags: req.body.tags?.split(",").map((tag) => tag.trim()),
            status: req.body.status || "published",
        };

        if (req.file) {
            blogData.image = `/uploads/blogs/${req.file.filename}`;
        }

        const blog = new Blog(blogData);
        await blog.save();

        res.redirect(`/blogs/${blog.slug}`);
    } catch (error) {
        console.error(error);
        res.render("blogs/blog-create", {
            layout: "default",
            title: "Create Blog",
            error: "Failed to create blog",
            formData: req.body,
        });
    }
};

// [POST] /blogs/:id/vote
module.exports.handleVote = async (req, res) => {
    try {
        const { id } = req.params;
        const { voteType } = req.body;
        const userId = req.user._id;

        if (!["up", "down"].includes(voteType)) {
            return res.status(400).json({ success: false, message: "Invalid vote type" });
        }

        const blog = await Blog.findById(id);
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        const existingVoteIndex = blog.userVotes.findIndex(
            (vote) => vote.user.toString() === userId.toString(),
        );

        if (existingVoteIndex > -1) {
            const existingVote = blog.userVotes[existingVoteIndex];
            if (existingVote.voteType === voteType) {
                blog.userVotes.splice(existingVoteIndex, 1);
                blog.votes[`${voteType}votes`]--;
            } else {
                blog.votes[`${existingVote.voteType}votes`]--;
                blog.votes[`${voteType}votes`]++;
                existingVote.voteType = voteType;
            }
        } else {
            blog.userVotes.push({ user: userId, voteType });
            blog.votes[`${voteType}votes`]++;
        }

        blog.votes.score = blog.votes.upvotes - blog.votes.downvotes;
        await blog.save();

        res.json({
            success: true,
            upvotes: blog.votes.upvotes,
            downvotes: blog.votes.downvotes,
            userVoted: {
                up: blog.userVotes.some(
                    (vote) => vote.user.toString() === userId.toString() && vote.voteType === "up",
                ),
                down: blog.userVotes.some(
                    (vote) =>
                        vote.user.toString() === userId.toString() && vote.voteType === "down",
                ),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

// [POST] /blogs/:id/comment
module.exports.addComment = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        // Add the comment
        blog.comments.push({
            user_id: req.user._id,
            content: req.body.content,
        });

        await blog.save();

        // Create notification for blog author if commenter is not the author
        if (req.user._id.toString() !== blog.author.toString()) {
            await notificationService.createNotification({
                type: "comment",
                recipient: blog.author,
                sender: req.user._id,
                blog: blog._id,
                message: "commented on your blog post",
            });
        }

        // Redirect using the slug
        return res.redirect(`/blogs/${blog.slug}#comments`);
    } catch (error) {
        console.error("Comment error:", error);
        // Redirect back to the blog page with an error message
        const blog = await Blog.findById(req.params.id).select("slug").lean();
        req.flash("error", "Error adding comment");
        return res.redirect(`/blogs/${blog.slug}`);
    }
};

// [GET] /blogs/:id/edit
module.exports.editBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).lean();

        if (!blog) {
            return res.render("default/404");
        }

        // Check if user is the author
        if (blog.author.toString() !== req.user._id.toString()) {
            return res.redirect("/blogs");
        }

        res.render("blogs/blog-edit", {
            layout: "default",
            title: "Edit Blog",
            blog,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// [PUT] /blogs/:id
module.exports.updateBlog = async (req, res) => {
    try {
        const blogData = {
            title: req.body.title,
            content: req.body.content,
            description: req.body.description,
            category: req.body.category,
            tags: req.body.tags?.split(",").map((tag) => tag.trim()),
            status: req.body.status,
        };

        if (req.file) {
            blogData.image = `/uploads/blogs/${req.file.filename}`;
        }

        const blog = await Blog.findByIdAndUpdate(req.params.id, blogData, {
            new: true,
            runValidators: true,
        });

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.json({
            success: true,
            message: "Blog updated successfully",
            blog,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error updating blog",
            error: error.message,
        });
    }
};

// [GET] /users/me/stored/blogs
module.exports.showStoredBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ author: req.user._id }).sort({ createdAt: -1 }).lean();

        res.render("blogs/blog-store", {
            layout: "default",
            title: "My Blogs",
            blogs,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};
