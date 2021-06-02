const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const { generateAccessToken } = require('./auth');

const router = express.Router()


router.post("/", async (req, res) => {
    try {
        console.log(req.body)
        const database = req.app.locals.database
        const profile = await database.collection("Authentication").findOne({username: req.body.username});
        if (profile === null) throw "User does not exist"
        // Compare passwords
        const isValid = await bcrypt.compare(req.body.password, profile.password)
        if (isValid) {
            const {kid, token} = generateAccessToken(profile)
            res.send({
                kid: kid, 
                token: token
            })
        } else {
            res.sendStatus(401)
        }
    } catch (error) {
        console.log(error)
        res.sendStatus(401)
    }
})


module.exports = router;