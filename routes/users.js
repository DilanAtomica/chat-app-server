const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const {validateToken} = require("../JWT");
const {sign} = require("jsonwebtoken");

const mysql = require("mysql");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "chatapp",
});

router.post("/registerUser", async(req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const q = "INSERT INTO user (email, username, password) VALUES (?, ?, ?)";

        db.query(q, [req.body.email, req.body.username, hashedPassword], (err, data) => {
            if(err) res.json(err);
        });

        res.status(200).json("Successfully registered!");

    } catch (error) {
        if(error) res.status(400).json({error: error})
    }
});


module.exports = router;