const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const redis = require("redis");
const router = express.Router();

const saltRounds = 10;
const verificationExpirationSeconds = 3600;
router.use("/", async (req, res, next) => {
  try {
    const email = req.body.email.toLowerCase();

    const accountCollection =
      req.app.locals.database.collection("Verified-Accounts");
    const accountAlreadyExistsPromise = accountCollection.findOne({
      _id: email,
      email: email,
    });
    const hashedPasswordPromise = bcrypt.hash(req.body.password, saltRounds);

    const [accountAlreadyExists, hashedPassword] = await Promise.all([
      accountAlreadyExistsPromise,
      hashedPasswordPromise,
    ]);

    if (accountAlreadyExists) {
      return res
        .status(401)
        .send({ statusMessage: "Email already registered to Art-Flex" });
    }
    res.locals.hashedPassword = hashedPassword;
    next();
  } catch (error) {
    next(error);
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
      req.locals.hashedPassword
    );*/
    const signUpCollection = req.app.locals.database.collection("SignUpForms");

    const email = req.body.email.toLowerCase();
    //If someone previously attempted a sign up but did not complete verification,
    //then we want to replace their sign up entry.
    const vertificationToken = crypto.randomBytes(48).toString("hex");
    signUpCollection.createIndex(
      { verificationToken: 1 },
      { expireAfterSeconds: verificationExpirationSeconds },
      { unique: true }
    );

    await signUpCollection.replaceOne(
      { _id: email, email: email },
      {
        _id: email,
        email: email,
        password: res.locals.hashedPassword,
        verificationToken: vertificationToken,
      },
      { upsert: true }
    );

    res.locals.body = {
      email: email,
      verificationToken: vertificationToken,
    };
    next();
  } catch (error) {
    next(error);
  }
});

router.use("/", (error, req, res, next) => {
  // If the error code is 11000,
  // then it is a duplicate key, and the account already exists
  if (error.code === 11000) {
    return res.status(500).send({ statusMessage: "Account already exists" });
  } else {
    return res.status(500).send({ statusMessage: error.message });
  }
});

router.post("/", (req, res) => {
  return res.status(200).send(res.locals.body);
});

module.exports = router;
