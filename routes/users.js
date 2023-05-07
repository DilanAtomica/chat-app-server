const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const {validateToken} = require("../JWT");
const {sign} = require("jsonwebtoken");

const mysql = require("mysql2");
require('dotenv').config()

/*const pool = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "chatapp",
}).promise();

 */
const pool = mysql.createConnection(process.env.DATABASE_URL).promise();

router.post("/userDetails", validateToken, async(req, res) => {
    try {
        const userDetails = await pool.query("SELECT userID, username, email FROM user WHERE userID = ? LIMIT 1",
            [req.tokenData.id]);
        res.status(200).json(userDetails[0][0]);
    } catch (error) {
        res.status(400).json({error: error});
    }

});



router.post("/registerUser", async(req, res) => {
    try {

        const {email, username, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const [usernames] = await pool.query("SELECT username FROM user WHERE username = ? LIMIT 1", [req.body.username]);
        const [emails] = await pool.query("SELECT email FROM user WHERE email = ? LIMIT 1", [req.body.email]);

        let takenInputs = {
            username: false,
            email: false,
        }

        if(usernames.length !== 0) takenInputs = {...takenInputs, username: true}
        if(emails.length !== 0) takenInputs = {...takenInputs, email: true}

            if (takenInputs.username || takenInputs.email) {
                res.status(409).json(
                    {
                        message: "User exists with those inputs",
                        emailTaken: takenInputs.email,
                        usernameTaken: takenInputs.username,
                    });
            }
            else {
                await pool.query("INSERT INTO user (email, username, password) VALUES (?, ?, ?)", [email, username, hashedPassword]);
                const [user] = await pool.query("SELECT * FROM user WHERE email = ?", [email]);
                const accessToken = sign({
                    id: user[0].userID,
                    email: user[0].email,
                    username: user[0].username
                }, "jwtsecretplschange");

                res.cookie("accessToken", accessToken, {
                    maxAge: 60*60*24*30*1000,
                    httpOnly: true,
                }).status(200).json({message: "Successfully registered!"});
            }

    } catch (error) {
        if(error) res.status(400).json({error: error});
    }
});

router.post("/login", async(req, res) => {
    try {
        const {email, password} = req.body;

        const [user] = await pool.query("SELECT * FROM user WHERE email = ?", [email]);
        if(user.length === 0) res.status(404).json({message: "A user with that email does not exist", errorType: "noEmail"});
        else {
            const matching = await bcrypt.compare(password, user[0].password);
            if(!matching) res.status(404).json({message: "Wrong Email or password combination", errorType: "wrongComb"});
            else {
                const accessToken = sign({
                    id: user[0].userID,
                    email: user[0].email,
                    username: user[0].username
                }, "jwtsecretplschange");

                res.cookie("accessToken", accessToken, {
                    maxAge: 60*60*24*30*1000,
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                    domain: "onrender.com",
                }).status(200).json({message: "Logged in Successfully!"});
            }
        }
    } catch (error) {
        res.status(400).json({error: error});
    }

});

router.post("/auth", validateToken, async(req, res) => {
    if(req.authenticated) {
        res.status(200).json({authenticated: true});
    } else {
        res.status(200).json({authenticated: false});
    }
});

router.post("/logout", validateToken, async(req, res) => {
    res.clearCookie("accessToken", {domain: "onrender.com", path: "/"});
    res.status(200).json("Successfully logged out!");
});

module.exports = router;