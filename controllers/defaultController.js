//controllers/defaultController.js
const Config = require("../config/configuration");
const { redirect } = require("express/lib/response");
const Recipe = require("../models/Recipe");

// Controller function for rendering the home page
module.exports.show = async (req, res) => {
    try {
        // Get recipe data from the database
        const data = await Recipe.find().lean();

        // Render the home page with the recipe data
        res.render("default/home", {
            layout: "default",
            title: "Browse recipes",
            recipes: data,
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
