const express = require('express');
const bcrypt = require('bcrypt')
const redis = require('redis')
const fs = require('fs');
const router = express.Router();

const 

const saltRounds = 10;
router.use("/", async (req, res, next) => {
    try {
        await bcrypt.hash(req.body.password, saltRounds)
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
        await 
        next() 
} )
router.post("/", (req, res) => {
    res.send("Successfully Signed up")
});

module.exports = router;