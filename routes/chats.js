const express = require("express");
const router = express.Router();
const {validateToken} = require("../JWT");

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


module.exports = router;