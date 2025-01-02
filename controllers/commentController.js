const Blog = require('../models/Blog');
const Recipe = require('../models/Recipe');
const notificationService = require('../services/notificationService');

// [POST] /blogs/:slug/comment or /recipes/:slug/comment
exports.addComment = async (req, res) => {
    try {
        const { slug } = req.params;
        const contentType = req.baseUrl.includes('blogs') ? 'Blog' : 'Recipe';
        const Model = contentType === 'Blog' ? Blog : Recipe;

        // Find the document by slug
        const document = await Model.findOne({ slug });
        if (!document) {
            req.flash("error", `${contentType} not found`);
            return res.redirect(`/${contentType.toLowerCase()}s`);
        }

        // Add the comment
        document.comments.push({
            user_id: req.user._id,
            content: req.body.content,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await document.save();

        // Create notification if commenter is not the author
        if (req.user._id.toString() !== document.author.toString()) {
            await notificationService.createCommentNotification(
                req.user, 
                document, 
                contentType
            );
        }

        res.redirect("back");
    } catch (error) {
        console.error("Comment error:", error);
        req.flash("error", "Error adding comment");
        return res.redirect(`/${contentType.toLowerCase()}s/${slug}`);
    }
};

// [PUT] /blogs/:slug/comment/edit or /recipes/:slug/comment/edit
exports.updateComment = async (req, res) => {
    try {
        const { slug } = req.params;
        const commentId = req.query.id;
        const { content } = req.body;
        const contentType = req.baseUrl.includes('blogs') ? 'Blog' : 'Recipe';
        const Model = contentType === 'Blog' ? Blog : Recipe;
        
        // Find the document by slug and populate user data for comments
        const document = await Model.findOne({ slug }).populate({
            path: 'comments.user_id',
            select: 'username profile_picture'
        });

        if (!document) {
            return res.status(404).json({ message: `${contentType} not found` });
        }

        // Find the specific comment
        const comment = document.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user is the comment owner
        if (comment.user_id._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this comment' });
        }

        // Update the comment
        comment.content = content;
        comment.updatedAt = new Date();
        await document.save();

        // Send back updated comment data
        res.json({
            comment: {
                _id: comment._id,
                content: comment.content,
                user_id: comment.user_id,
                createdAt: comment.createdAt,
                updatedAt: comment.updatedAt
            }
        });

    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ message: 'Error updating comment' });
    }
};

// [DELETE] /blogs/:slug/comment/delete or /recipes/:slug/comment/delete
exports.deleteComment = async (req, res) => {
    try {
        const { slug } = req.params;
        const commentId = req.query.id;
        const contentType = req.baseUrl.includes('blogs') ? 'Blog' : 'Recipe';
        const Model = contentType === 'Blog' ? Blog : Recipe;

        // Find the document by slug
        const document = await Model.findOne({ slug });
        if (!document) {
            return res.status(404).json({ message: `${contentType} not found` });
        }

        // Find the specific comment
        const comment = document.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user is the comment owner
        if (comment.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        // Remove the comment
        document.comments.pull(commentId);
        await document.save();

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Error deleting comment' });
    }
}; 