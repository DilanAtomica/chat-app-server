const express = require("express");
const router = express.Router();
const {validateToken} = require("../JWT");
const axios = require("axios");

const mysql = require("mysql2");


/*const pool = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "chatapp",
}).promise();

 */
const pool = mysql.createConnection("mysql://x671yzlultf0wbmygj1f:pscale_pw_pcyUFcv1ELgkQbbEaOoSQlcanFDZ7VIMHS45hmvbJyd@aws.connect.psdb.cloud/chatapp?ssl={\"rejectUnauthorized\":true}").promise();


router.post("/searchResult", validateToken, async(req, res) => {
        try {
            const {searchWord, page} = req.body;
            const movies = await axios.get("https://api.themoviedb.org/3/search/tv" +
                "?api_key=cd84bfb51d317868c15507e4f531548f&query=" + searchWord + "&page=" + page);
            res.status(200).json(movies.data);
        } catch(error) {
            res.status(404).json({message: "Something went wrong"});
        }

});

router.post("/seriesResult", validateToken, async(req, res) => {
    try {
        const {seriesID} = req.body;
        if(seriesID === null) return;
        const series = await axios.get("https://api.themoviedb.org/3/tv/" + seriesID +
            "?api_key=cd84bfb51d317868c15507e4f531548f&language=en-US)");
        res.status(200).json(series.data);
    } catch(error) {
        res.status(404).json({message: "Something went wrong"});
    }
});

module.exports = router;