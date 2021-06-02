const express = require("express");
const bcrypt = require("bcrypt");
const redis = require("redis");
const router = express.Router();

const saltRounds = 10;
router.use("/", async (req, res, next) => {
  try {
    const hashed_password = await bcrypt.hash(req.body.password, saltRounds);
    res.locals.hashed_password = hashed_password;
    next();
  } catch (error) {
    res.sendStatus(500);
  }
});
router.use("/", async (req, res, next) => {
  // Post to cache
  // Post to database
  // If either of these fail rollback the transaction
  try {
    /*
    await req.app.locals.master_cache_set(
      req.body.username,
      req.locals.hashed_password
    );*/
    await req.app.locals.database.collection("Authentication").insertOne({
      _id: req.body.email,
      email: req.body.email,
      password: res.locals.hashed_password,
    });
    next();
  } catch (error) {
    // If the error code is 11000, 
    // then it is a duplicate key, and the account already exists
    if (error.code === 11000) {
        res.status(500).send({ error: "Account already exists" });
    } else {
        res.status(500).send({ error: "Could not sign user up"})
    }
  }
});
router.post("/", (req, res) => {
  res.send("Successfully Signed up");
});

module.exports = router;
