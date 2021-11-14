/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { MONGO_ACCOUNTS_DB } from "./secrets";
import { generateRefreshToken } from "./auth";

const router = express.Router();

const saltRounds = 10;
const verificationExpirationSeconds = 60 * 30;

const isUserVerified = async (req, res, next) => {
  try {
    const email = req.body.email.toLowerCase();
    const accountCollection =
      req.app.locals.database.collection("Verified-Accounts");
    const accountAlreadyExists = await accountCollection.findOne({
      _id: email,
      email
    });
    if (accountAlreadyExists !== null) {
      return res
        .status(401)
        .send({ statusMessage: "Email already registered to Art-Flex." });
    }
    return next();
  } catch (error) {
    console.log("isUserVerifiedError");
    console.log(error);
    return next(error);
  }
};

const hashPassword = async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    res.locals.hashedPassword = hashedPassword;
    next();
  } catch (error) {
    console.log("hassPasswordError");
    next(error);
  }
};
const signUpUser = async (req, res, next) => {
  // Post to cache
  // Post to database
  // If either of these fail rollback the transaction
  try {
    /*
    await req.app.locals.master_cache_set(
      req.body.username,
      req.locals.hashedPassword
    ); */
    const signUpCollection = req.app.locals.database.collection("SignUpForms");

    const email = req.body.email.toLowerCase();
    // If someone previously attempted a sign up but did not complete verification,
    // then we want to replace their sign up entry.
    const verificationToken = crypto.randomBytes(48).toString("hex");
    signUpCollection.createIndex(
      { verificationToken: 1 },
      { expireAfterSeconds: verificationExpirationSeconds, unique: true }
    );
    // Notice the tokenCreatedAt field,
    // its a safe guard in case mongodb forgets to delete the entry after expiration
    await signUpCollection.replaceOne(
      { _id: email, email },
      {
        _id: email,
        name: req.body.name,
        email,
        password: res.locals.hashedPassword,
        verificationToken,
        tokenCreatedAt: new Date().getTime()
      },
      { upsert: true }
    );

    res.locals.body = {
      email,
      verificationToken
    };
    return next();
  } catch (error) {
    console.log("signUpUserError");
    return next(error);
  }
};

const verifyUser = async (req, res, next) => {
  try {
    res.locals.email = req.body.email.toLowerCase();
    const signUpCollection = req.app.locals.database.collection("SignUpForms");
    res.locals.user = await signUpCollection.findOne({
      _id: res.locals.email,
      email: res.locals.email,
      verificationToken: req.body.token
    });
    if (!res.locals.user) {
      return res.status(401).send({
        statusMessage:
          "Could not verify account. Sign up form has not been filled out or verification token is incorrect."
      });
    }

    // Check to make sure the current time minus the tokenCreatedAt entry is less than the expiration time
    const currentTime = new Date().getTime();
    const timeElapsed = (currentTime - res.locals.user.tokenCreatedAt) / 1000; // Convert from ms to s
    const isValid =
      timeElapsed < verificationExpirationSeconds && timeElapsed >= 0; // in case the current time is off for some reason
    if (!isValid) {
      return res.status(401).send({
        statusMessage:
          "Could not verify account. Verification token is expired."
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

const refreshTokenForVerifiedUser = (req, res, next) => {
  const [refreshTokenId, refreshToken] = generateRefreshToken({
    name: res.locals.user.name,
    email: res.locals.user.email
  });
  res.locals.refreshTokenId = refreshTokenId;
  res.locals.refreshToken = refreshToken;
  next();
};

const addUserToVerifiedAccounts = async (req, res, next) => {
  try {
    const accountCollection =
      req.app.locals.database.collection("Verified-Accounts");
    await accountCollection.insertOne({
      _id: res.locals.user.email,
      name: res.locals.user.name,
      email: res.locals.user.email,
      password: res.locals.user.password,
      refreshTokenId: res.locals.refreshTokenId,
      role: res.locals.user.role
    });
    next();
  } catch (error) {
    next(error);
  }
};
const addUserToAccountsDB = async (req, res, next) => {
  try {
    const accountCollection = req.app.locals.mongoDBClient
      .db(MONGO_ACCOUNTS_DB)
      .collection("accounts");

    await accountCollection.replaceOne(
      {
        _id: res.locals.user.email,
        name: res.locals.user.name,
        email: res.locals.user.email,
        role: res.locals.user.role
      },
      { upsert: true }
    );
    next();
  } catch (error) {
    next(error);
  }
};

router.post("/new", [isUserVerified, hashPassword, signUpUser], (req, res) =>
  res.status(200).send(res.locals.body)
);

router.post(
  "/verify",
  [
    isUserVerified,
    verifyUser,
    refreshTokenForVerifiedUser,
    addUserToVerifiedAccounts,
    addUserToAccountsDB
  ],
  (req, res) =>
    res.status(200).send({
      name: res.locals.user.name,
      email: res.locals.user.email,
      refreshToken: res.locals.refreshToken,
      statusMessage: "Successfully verfied user. Account created."
    })
);

router.use((error, req, res) => {
  // We need to conceal errors, console.log them
  console.log(error);
  return res.sendStatus(500);
});

export default router;
