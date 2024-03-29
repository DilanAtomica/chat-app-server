const express = require("express");
const router = express.Router();
const {validateToken} = require("../JWT");
const axios = require("axios");
const mysql = require("mysql2");
const { validationResult, body, query } = require('express-validator');

const pool = mysql.createConnection(process.env.DATABASE_URL).promise();

router.post("/chatQueue", validateToken, body(["seriesID", "season", "episode"]).trim().notEmpty().isInt().isNumeric(), async(req, res) => {
    try {
        const result = validationResult(req);
        if(result.errors.length === 0) {
            const {seriesID, season, episode} = req.body;

            const existingQueue = await pool.query(
                "SELECT * FROM chat_queue WHERE (seriesID, season, episode) = (?, ?, ?) LIMIT 1",
                [seriesID, season, episode]);

            const existingChats = await pool.query("SELECT chatID FROM chatters WHERE (userID) = (?)", [req.tokenData.id]);

            let chatAlreadyCreated = false;
            for(let i = 0; i < existingChats[0].length; i++) {
                const chat = await pool.query("SELECT chatID FROM chat WHERE chatID = ? AND seriesID = ? AND seriesSeason = ? AND seriesEpisode = ?",
                    [existingChats[0][i].chatID, seriesID, season, episode]);
                if(chat[0].length !== 0) chatAlreadyCreated = true;
            }

            if(chatAlreadyCreated) res.status(409).json({message: "Already have chat"});

            else if((existingQueue[0].length === 1 && existingQueue[0][0].userID === req.tokenData.id)) {
                res.status(409).json({message: "Already queued"});
            }

            else if(existingQueue[0].length === 1) {

                await pool.query("DELETE FROM chat_queue WHERE chat_queueID = ?", [existingQueue[0][0].chat_queueID]);

                const series = await axios.get("https://api.themoviedb.org/3/tv/" + seriesID +
                    "?api_key=cd84bfb51d317868c15507e4f531548f&language=en-US)");

                await pool.query("INSERT INTO chat (seriesName, seriesEpisode, seriesSeason, seriesImage, seriesID) VALUES (?, ?, ?, ?, ?)",
                    [series.data.name, episode, season, series.data.backdrop_path, seriesID]);

                const result = await pool.query(
                    "SELECT chatID FROM chat WHERE (seriesName, seriesEpisode, seriesSeason, seriesImage) = (?, ?, ?, ?) ORDER BY created_at ASC LIMIT 1",
                    [series.data.name, episode, season, series.data.backdrop_path]);

                //Insert both users in chatters table
                await pool.query("INSERT INTO chatters (userID, chatID) VALUES (?, ?)",
                    [req.tokenData.id, result[0][0].chatID]);

                await pool.query("INSERT INTO chatters (userID, chatID) VALUES (?, ?)",
                    [existingQueue[0][0].userID, result[0][0].chatID]);

                //Send notification to other user
                const notificationText = "A chat for a dicussion of " + series.data.name + " season " + season + ", episode " + episode + " has been made, you can find it in the chat page";
                await pool.query("INSERT INTO notifications (userID, notificMsg) VALUES (?, ?)",
                    [existingQueue[0][0].userID, notificationText]);

                res.status(200).json({message: "Success!", chatCreated: true});
            } else {
                await pool.query("INSERT INTO chat_queue (userID, seriesID, season, episode) VALUES (?, ?, ?, ?)",
                    [req.tokenData.id, seriesID, season, episode]);
                res.status(200).json({message: "Success!", chatCreated: false});
            }
        } else res.status(400).json({message: "Body data is invalid"});
    } catch(error) {
        res.status(404).json({message: "Something went wrong"});
    }
});

router.get("/activeChatQueues", validateToken, async(req, res) => {
    try {
            const result = await pool.query("SELECT * FROM chat_queue WHERE userID = ? ORDER BY created_at DESC",
                [req.tokenData.id]);
            let shows = [];

            for(let i = 0; i < result[0].length; i++) {
                const series = await axios.get("https://api.themoviedb.org/3/tv/" + result[0][i].seriesID +
                    "?api_key=cd84bfb51d317868c15507e4f531548f&language=en-US)");
                let showInfo = {
                    chatQueueID: result[0][i].chat_queueID,
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

router.delete("/deleteChatQueue", validateToken, query("chatQueueID").trim().notEmpty().isNumeric(), async(req, res) => {
    try {
        const result = validationResult(req);
        if(result.errors.length === 0) {
            const {chatQueueID} = req.query;
            await pool.query("DELETE FROM chat_queue WHERE chat_queueID = ?",
                [chatQueueID]);
            res.status(200).json({message: "Success!"});
        } else res.status(400).json({message: "Query data is invalid"});
    } catch(error) {
        res.status(404).json({message: "Something went wrong"});
    }
});

router.get("/chatsData", validateToken, async(req, res) => {
    try {
        const result = await pool.query("SELECT chatID FROM chatters WHERE userID = ?",
            [req.tokenData.id]);

        if(result[0].length === 0) res.status(200).json(null);

        else {
            const {chatID} = result[0][0];
            let chats = [];
            for(let j = 0; j < result[0].length; j++) {
                const chat = await pool.query("SELECT * FROM chat WHERE chatID = ?",
                    [result[0][j].chatID]);
                chats = [...chats, chat[0][0]];
            }
            for(let i = 0; i < chats.length; i++) {
                const chatter = await pool.query("SELECT userID FROM chatters WHERE chatID = ? AND NOT userID = ? LIMIT 1",
                    [chatID, req.tokenData.id]);

                const otherUserData = await pool.query("SELECT username FROM user WHERE userID = ?",
                    [chatter[0][0].userID]);

                chats[i] = {...chats[i], otherUserName: otherUserData[0][0].username}
            }

            res.status(200).json(chats);
        }
    } catch(error) {
        res.status(404).json({message: "Something went wrong"});
    }
});

router.get("/chatData", validateToken, query("chatID").trim().notEmpty().isNumeric(), async(req, res) => {
    try {
        const result = validationResult(req);
        if(result.errors.length === 0) {
            const {chatID} = req.query;

            const chatResult = await pool.query("SELECT * FROM chat WHERE chatID = ?",
                [chatID]);

            if(chatResult[0].length === 0) res.status(200).json(null);

            else {
                const chatter = await pool.query("SELECT userID FROM chatters WHERE chatID = ? AND NOT userID = ? LIMIT 1",
                    [chatID, req.tokenData.id]);

                const otherUserData = await pool.query("SELECT username FROM user WHERE userID = ?",
                    [chatter[0][0].userID]);

                chatResult[0][0] = {...chatResult[0][0], otherUserName: otherUserData[0][0].username};

                const messagesResult = await pool.query("SELECT * FROM messages WHERE chatID = ? ORDER BY created_at DESC",
                    [chatID]);

                if(messagesResult[0]) {
                    for(let i = 0; i < messagesResult[0].length; i++) {
                        if(messagesResult[0][i].userID === req.tokenData.id) {
                            messagesResult[0][i] = {...messagesResult[0][i], messageSent: true}
                        } else messagesResult[0][i] = {...messagesResult[0][i], messageSent: false}

                        const formatDate = new Date(messagesResult[0][i].created_at);
                        const dateSent = formatDate.getDate() + "." + formatDate.getMonth() + 1 + "." + formatDate.getFullYear();
                        messagesResult[0][i] = {...messagesResult[0][i], dateSent: dateSent}
                    }
                    chatResult[0][0] = {...chatResult[0][0], messages: messagesResult[0]};
                };

                res.status(200).json(chatResult[0][0]);
            }
        } else res.status(400).json({message: "Query data is invalid"});

    } catch(error) {
        res.status(404).json({message: "Something went wrong"});
    }
});

router.post("/message", validateToken, async(req, res) => {
    try {
            const {chatID, text} = req.body.messageData;

            await pool.query("INSERT INTO messages (chatID, userID, message) VALUES (?, ?, ?)",
                [chatID, req.tokenData.id, text]);

            res.status(200).json({message: "Success!"});
    } catch(error) {
        res.status(404).json({message: "Something went wrong"});
    }
});

router.delete("/leaveChat", validateToken, async(req, res) => {
    try {
            const {chatID} = req.query;
            await pool.query("DELETE FROM chat WHERE chatID = ?",
                [chatID]);

            await pool.query("DELETE FROM messages WHERE chatID = ?",
                [chatID]);

            await pool.query("DELETE FROM chatters WHERE chatID = ?",
                [chatID]);
            res.status(200).json({message: "Success!"});
    } catch(error) {
        res.status(404).json({message: "Something went wrong"});
    }
});

router.get("/notifications", validateToken, async(req, res) => {
    try {
        const notifications = await pool.query("SELECT * FROM notifications WHERE userID = ? ORDER BY created_at DESC",
            [req.tokenData.id]);
        res.status(200).json(notifications[0]);
    } catch(error) {
        res.status(404).json({message: "Something went wrong"});
    }
});

router.put("/readNotification", validateToken, async(req, res) => {
    try {
            const {notificID, isRead} = req.body.openNotificData;
            if(isRead ===  0) {
                await pool.query("UPDATE notifications SET isRead = ? WHERE notificID = ?",
                    [1, notificID]);
                res.status(200).json({message: "Successfully read!"});
        } else res.status(200).json({message: "Notification already read!"});
    } catch(error) {
        res.status(404).json({message: "Something went wrong"});
    }
});










module.exports = router;