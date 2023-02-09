const express = require("express");
const router = express.Router();
const {validateToken} = require("../JWT");
const axios = require("axios");

const mysql = require("mysql2");

const pool = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "chatapp",
}).promise();

router.post("/chatQueue", validateToken, async(req, res) => {
    try {
        const {seriesID, season, episode} = req.body;
        await pool.query("INSERT INTO chat_queue (userID, seriesID, season, episode) VALUES (?, ?, ?, ?)",
            [req.tokenData.id, seriesID, season, episode]);
        res.status(200).json({message: "Success!"});
    } catch(error) {
        res.status(404).json({message: "Something went wrong"});
    }
});

router.post("/activeChatQueues", validateToken, async(req, res) => {
    try {
        const result = await pool.query("SELECT * FROM chat_queue WHERE userID = ?",
            [req.tokenData.id]);
        let shows = [];

        for(let i = 0; i < result[0].length; i++) {
            const series = await axios.get("https://api.themoviedb.org/3/tv/" + result[0][i].seriesID +
                "?api_key=cd84bfb51d317868c15507e4f531548f&language=en-US)");
            let showInfo = {
                seriesID: result[0][i].seriesID,
                name: series.data.name,
                image: series.data.backdrop_path,
                season: result[0][i].season,
                episode: result[0][i].episode,
                created_at: result[0][i].created_at,
            }
            shows = [...shows, showInfo];
        }
        res.status(200).json(shows);
    } catch(error) {
        res.status(404).json({message: "Something went wrong"});
    }
});



module.exports = router;