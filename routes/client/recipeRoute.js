const express = require("express");
const router = express.Router();
const recipesController = require("../../controllers/recipeController");
const recipeDetailController = require("../../controllers/recipe-detailController");

router.get("/:slug", recipeDetailController.show);
router.get("/", recipesController.show); // get this method to render view
module.exports = router;
