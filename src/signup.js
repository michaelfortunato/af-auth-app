const express = require('express');
const bcrypt = require('bcrypt')
const redis = require('redis')
const router = express.Router();


const saltRounds = 10;
router.use("/", async (req, res, next) => {
    try {
        console.log(req.body)
        const hashed_password = await bcrypt.hash(req.body.password, saltRounds)
        res.locals.hashed_password = hashed_password
        next()
    } catch (error) {
        res.sendStatus(500)
        res.send("Sign up failed.")
    }
    } )
router.use("/", async (req, res, next) => {
        // Post to cache
        // Post to database
        // If either of these fail rollback the transaction
        try {
            console.log("made it here")
            await req.app.locals.master_cache_set(req.body.username, res.locals.hashed_password)
            await req.app.locals.database.collection("Authentication").insertOne(
            {
                username: req.body.username, 
                password: res.locals.hashed_password
            }
        )
        next()} catch (error) {
            console.log(error)
        } 
} )
router.post("/", (req, res) => {
    res.send("Successfully Signed up")
})

module.exports = router;