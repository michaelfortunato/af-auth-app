const express = require('express');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const router = express.Router();
const numKeys = null;

// Middlewear for getting the number of keys

const getNumKeys = () => {
    // Get local file location, for now we just return 1
    return 1
}

router.post("/", (req, res) => {
    // Hash the password using one of the stored keys. 
    numKeys = numKeys && getNumKeys();
    // Get a random key from 1 to 6
    const kid = Math.floor(Math.uniform() * numKeys + 1);
    // Now that we have the kid, we can now hash the password with the symmetric key 
    const hashedPassword = "foo"; //;
    // Post it to redis
    // Post it to the db. 
    
    const private_key = fs.readFileSync(config.privateKeyFile);
});