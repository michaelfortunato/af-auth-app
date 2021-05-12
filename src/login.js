const express = require('express');
const { MongoClient } = require('mongodb');
const { generateAccessToken } = require('./auth');

const router = express.Router()


router.post("/", async (req, res) => {
    try {
    const database = req.app.locals.database
    const profile = await database.collection("Authentication").findOne({username: "user1"});
    const jwt = generateAccessToken(profile)
    res.send(jwt)
    throw "badd"
    } catch (error) {
        res.send(error.message)
    }
})


module.exports = router;