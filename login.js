const express = require('express');
const { MongoClient } = require('mongodb');
const { generateAccessToken } = require('./auth');

const router = express.Router()

router.get("/", async (req, res) => {
    const database = req.app.locals.database
    const profile = await database.collection("Authentication").findOne({username: "user1"});
    res.send(profile)
})

module.exports = router;