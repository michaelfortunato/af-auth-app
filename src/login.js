const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const { generateAccessToken } = require('./auth');

const router = express.Router()


router.post("/", async (req, res) => {
    try {
        const database = req.app.locals.database
        const profile = await database.collection("Authentication").findOne({username: "user1"});
           
        console.log(req.body.password)
        // Compare passwords
        const isValid = await bcrypt.compare(req.body.password, hashedPassword)
        if (isValid) {
            const {kid, token} = generateAccessToken(profile)
            res.send({
                kid: kid, 
                token: token
            })
        } else {
            res.sendStatus(401)
            res.send("Invalid username or password")
        }
    } catch (error) {
        console.log(error)
        res.send(error.message)
    }
})


module.exports = router;