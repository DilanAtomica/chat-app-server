const express = require("express");
const router = express.Router();
const {validateToken} = require("../JWT");
const axios = require("axios");
const { validationResult, query, checkSchema } = require('express-validator');
const {searchValidation} = require("../validationSchemas");

router.get("/searchResult", checkSchema(searchValidation, ["query"]), validateToken, async(req, res) => {
        try {
            const result = validationResult(req);
            console.log(result.errors);
            if(result.errors.length === 0) {
                const {searchWord, page} = req.query;
                const movies = await axios.get("https://api.themoviedb.org/3/search/tv" +
                    "?api_key=cd84bfb51d317868c15507e4f531548f&query=" + searchWord + "&page=" + page);
                res.status(200).json(movies.data);
            } else res.status(400).json({message: "Query data is invalid"});
        } catch(error) {
            res.status(404).json({message: "Something went wrong"});
        }

});

router.get("/seriesResult", query("seriesID").trim().notEmpty().isNumeric(), validateToken, async(req, res) => {
    try {
        const result = validationResult(req);
        if(result.errors.length === 0) {
            const {seriesID} = req.query;
            if(seriesID === null) return;
            const series = await axios.get("https://api.themoviedb.org/3/tv/" + seriesID +
                "?api_key=cd84bfb51d317868c15507e4f531548f&language=en-US)");
            res.status(200).json(series.data);
        } else res.status(400).json({message: "Query data is invalid"});
    } catch(error) {
        res.status(404).json({message: "Something went wrong"});
    }
});

module.exports = router;