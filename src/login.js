const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateAccessToken, generateRefreshToken } = require("./auth");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const database = req.app.locals.database;
    const authCollection = database.collection("Authentication");
    const profileCursor = await authCollection.find({ _id: req.body.email });
    // A mongodb cursor is returned
    const profile = await profileCursor.next();
    // If not profile exists, exit.
    if (profile === null) {
      console.log(`Profile is null ${req.body.email}`);
      res
        .status(500)
        .send({ statusMessage: "Could not log in. Email or password is incorrect." });
    }

    // If more than one profiles exist,
    // then the database is corrupt.
    // This needs to be logged
    const isNext = await profileCursor.next();
    if (isNext) {
      console.log("More than one record found");
      console.log(profile);
      console.log(isNext);
      console.log(profileCursor);
      res.status(500).send({ statusMessage: "Service is down. Check back later." });
    }

    // Compare passwords
    const isValid = await bcrypt.compare(req.body.password, profile.password);
    if (!isValid) {
      console.log("Genuinely invalid");
      res
        .status(401)
        .send({ statusMessage: "Could not log in. Email or password is incorrect." });
    }

    const accessToken = generateAccessToken({email: profile.email});
    const [refreshTokenId, refreshToken] = generateRefreshToken({email: profile.email});
    // Decode the refresh token and get the header, which contains the jwtid
    // jwt.decode should NEVER be used to validate any token
    
    await authCollection.updateOne(
      { _id: req.body.email },
      {
        $set: {
          refreshJwtId:refreshTokenId 
        },
      }
    );
    /*res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      path: "/refresh-token",
    });*/
    res.send({
      statusMessage: "Successfully logged in",
      accessToken: accessToken,
      refreshToken: refreshToken
    });
  } catch (error) {
    console.log(error);
    res
      .status(401)
      .send({ statusMessage: "Could not log in. Email or password is incorrect." });
  }
});

module.exports = router;
