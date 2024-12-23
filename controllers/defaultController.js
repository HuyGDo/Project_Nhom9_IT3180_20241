//controllers/defaultController.js
const Config = require("../config/configuration");
const { redirect } = require("express/lib/response");
const Recipe = require("../models/Recipe");

// Controller function for rendering the home page
module.exports.show = async (req, res) => {
    try {
        // Lấy trending recipes
        let trendingRecipes = await Recipe.find()
            .sort({ 
                'votes.score': -1,  // Sort by score first
                'votes.upvotes': -1 // Then by number of upvotes
            })
            .limit(8)
            .lean();

        // Tính lại score cho mỗi recipe
        trendingRecipes = trendingRecipes.map(recipe => ({
            ...recipe,
            votes: {
                ...recipe.votes,
                score: recipe.votes.upvotes - recipe.votes.downvotes
            }
        }));

        // Lấy các recipes thông thường
        const regularRecipes = await Recipe.find()
            .sort({ createdAt: -1 })
            .lean();

        res.render("default/home", {
            layout: "default",
            title: "Browse recipes",
            trendingRecipes,
            recipes: regularRecipes,
        });
    } catch (error) {
        console.error("Error fetching recipes:", error);
        res.status(500).send("An error occurred while fetching recipes.");
    }
};

// Thêm hàm search mới
module.exports.search = async (req, res) => {
    try {
        const keyword = req.query.q || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 12; // số recipe mỗi trang
        
        // Tạo query tìm kiếm
        const searchQuery = {
            $or: [
                { title: { $regex: keyword, $options: 'i' } }, // Tìm trong tiêu đề
                { description: { $regex: keyword, $options: 'i' } }, // Tìm trong mô tả
                { 'ingredients.name': { $regex: keyword, $options: 'i' } } // Tìm trong nguyên liệu
            ]
        };

        // Đếm tổng số kết quả
        const total = await Recipe.countDocuments(searchQuery);
        
        // Lấy recipes cho trang hiện tại
        const recipes = await Recipe.find(searchQuery)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Tính toán phân trang
        const totalPages = Math.ceil(total / limit);
        
        res.render("default/search", {
            layout: "default",
            title: `Search Results for "${keyword}"`,
            recipes,
            searchData: {
                keyword,
                total,
                currentPage: page,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page + 1,
                prevPage: page - 1
            }
        });
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).send("An error occurred while searching");
    }
};
