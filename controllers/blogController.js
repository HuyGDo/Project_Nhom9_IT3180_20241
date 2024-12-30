const Blog = require("../models/Blog");
const notificationService = require("../services/notificationService");
const fuzzball = require("fuzzball");

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
            searchType: "blogs",
            searchPlaceholder: "blogs",
            isBlogs: true,
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
            .populate('author')
            .populate({
                path: 'comments.user_id',
                select: 'username first_name last_name profile_picture'
            })
            .lean();

        if (!blog) {
            return res.render("default/404");
        }

        // Add userVoted info if user is logged in
        if (req.user) {
            const userVote = blog.userVotes.find(
                (vote) => vote.user.toString() === req.user._id.toString()
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
            messages: {
                success: req.flash("success"),
                error: req.flash("error"),
            },
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

        // Create notifications for followers
        await notificationService.createNewContentNotification(
            req.user,
            blog._id,
            "Blog",
            blog.title,
        );

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

// [DELETE] /blogs/:slug
module.exports.deleteBlog = (req, res, next) => {
    Blog.deleteOne({ slug: req.params.slug })
        .then(() => res.redirect("back"))
        .catch(next);
};

// [POST] /blogs/:slug/vote
module.exports.handleVote = async (req, res) => {
    try {
        const { voteType } = req.body;
        const userId = req.user._id;

        if (!["up", "down"].includes(voteType)) {
            return res.status(400).json({ success: false, message: "Invalid vote type" });
        }

        const blog = await Blog.findOne({ slug: req.params.slug });
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

// [POST] /blogs/:slug/comment
module.exports.addComment = async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug });
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        // Add the comment
        blog.comments.push({
            user_id: req.user._id,
            content: req.body.content,
        });

        await blog.save();

        // Create notification if commenter is not the author
        if (req.user._id.toString() !== blog.author.toString()) {
            await notificationService.createCommentNotification(req.user, blog, "Blog");
        }

        return res.redirect(`/blogs/${blog.slug}#comments`);
    } catch (error) {
        console.error("Comment error:", error);
        const blog = await Blog.findById(req.params.id).select("slug").lean();
        req.flash("error", "Error adding comment");
        return res.redirect(`/blogs/${blog.slug}`);
    }
};

// [GET] /blogs/:slug/edit
module.exports.editBlog = async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug }).lean();

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

// [PUT] /blogs/:slug
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

        const blog = await Blog.findOneAndUpdate({ slug: req.params.slug }, blogData, {
            new: true,
            runValidators: true,
        });

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.redirect(`/blogs/${blog.slug}`);
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

// Get all blogs
module.exports.getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find()
            .populate("author", "username avatar")
            .sort({ createdAt: -1 });

        res.render("blog/browse", {
            title: "Browse Blogs",
            blogs,
            searchType: "blogs",
            searchPlaceholder: "blogs",
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};

// Search blogs
module.exports.searchBlogs = async (req, res) => {
    try {
        console.log("Search query:", req.query);
        const query = req.query.q;
        if (!query) {
            console.log("No query provided, redirecting to /blogs");
            return res.redirect("/blogs");
        }

        // 1. Text search
        const textMatches = await Blog.find({
            $text: { $search: query },
        })
            .populate("author", "username first_name last_name profile_picture")
            .limit(10)
            .lean();
        console.log("Text search results:", textMatches.length);

        // 2. Fuzzy regex search
        const regexMatches = await Blog.find({
            $or: [
                { title: { $regex: query, $options: "i" } },
                { content: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
            ],
        })
            .populate("author", "username first_name last_name profile_picture")
            .limit(10)
            .lean();
        console.log("Regex search results:", regexMatches.length);

        // 3. Fuzzy scoring
        const allBlogs = await Blog.find()
            .populate("author", "username first_name last_name profile_picture")
            .limit(50)
            .lean();

        const fuzzyMatches = allBlogs
            .map((blog) => ({
                ...blog,
                score: Math.max(
                    fuzzball.partial_ratio(query.toLowerCase(), blog.title.toLowerCase()),
                    fuzzball.partial_ratio(query.toLowerCase(), blog.description.toLowerCase()),
                ),
            }))
            .filter((match) => match.score > 70)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        // Combine and deduplicate results using _id
        const seenIds = new Set();
        const combinedResults = [...textMatches, ...regexMatches, ...fuzzyMatches].filter(
            (blog) => {
                if (seenIds.has(blog._id.toString())) {
                    return false;
                }
                seenIds.add(blog._id.toString());
                return true;
            },
        );

        console.log("Total combined results:", combinedResults.length);

        // Render the correct view
        res.render("blogs/blog-browse", {
            title: `Search Results for "${query}"`,
            blogs: combinedResults,
            query,
            searchType: "blogs",
            searchPlaceholder: "blogs",
            isBlogs: true,
        });
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).send("Server Error");
    }
};
