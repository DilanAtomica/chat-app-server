const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const {validateToken} = require("../JWT");
const {sign} = require("jsonwebtoken");

const mysql = require("mysql2");

const pool = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "chatapp",
}).promise();


router.post("/registerUser", async(req, res) => {
    try {

        const {email, username, password} = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const [usernames] = await pool.query("SELECT username FROM user WHERE username = ?", [req.body.username]);
        const [emails] = await pool.query("SELECT email FROM user WHERE email = ?", [req.body.email]);

        let takenInputs = {
            username: false,
            email: false,
        }

        if(usernames.length !== 0) takenInputs = {...takenInputs, username: true}
        if(emails.length !== 0) takenInputs = {...takenInputs, email: true}

        console.log(takenInputs.username);
        console.log(takenInputs.email);

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
                res.status(200).json("Successfully registered!");
            }

    } catch (error) {
        if(error) res.status(400).json({error: error});
    }
});

router.post("/login", async(req, res) => {
    const {email, password} = req.body;
    //const user = await Users.findOne({where: { username: username}});
    //if(!user) res.status(400).json({error: "User does not exist"});

    /*
    const matching = await bcrypt.compare(password, user.password);
    if(!matching) {
        res.status(400).json({error: "Wrong username and password combination"});
    } else {
        const accessToken = sign({username: user.username, id: user.id}, "jwtsecretplschange");

        res.cookie("accessToken", accessToken, {
            maxAge: 60*60*24*30*1000,
            httpOnly: true,
        }).status(200).json("Logged in Successfully!");
    }

     */
});

router.post("/auth", validateToken, async(req, res) => {
    if(req.authenticated) {
        //const user = await Users.findOne({where: { username: req.tokenData.username}});
        //const userData = {id: user.id, username: user.username, admin:  user.admin};
        //res.json(userData);
    } else {
        res.json(null)
    }
});


module.exports = router;