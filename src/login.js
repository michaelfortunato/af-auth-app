/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
import express from "express";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "./auth";
import { MONGO_AUTH_DB } from "./secrets";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const database = req.app.locals.mongoDBClient.db(MONGO_AUTH_DB);
    const authCollection = database.collection("Verified-Accounts");
    const profileCursor = await authCollection.find({ _id: req.body.email });
    // A mongodb cursor is returned
    const profile = await profileCursor.next();
    // If not profile exists, exit.
    if (profile === null) {
      console.log(`Profile is null ${req.body.email}`);
      return res.status(401).send({
        statusMessage: "Could not log in. Email or password is incorrect."
      });
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
      return res
        .status(500)
        .send({ statusMessage: "Service is down. Check back later." });
    }

    // Compare passwords
    const isValid = await bcrypt.compare(req.body.password, profile.password);
    if (!isValid) {
      console.log("Genuinely invalid");
      return res.status(401).send({
        statusMessage: "Could not log in. Email or password is incorrect."
      });
    }

    const accessToken = generateAccessToken({
      name: profile.name,
      email: profile.email
    });
    const [refreshTokenId, refreshToken] = generateRefreshToken({
      name: profile.name,
      email: profile.email
    });
    // Decode the refresh token and get the header, which contains the jwtid

    await authCollection.updateOne(
      { _id: req.body.email },
      {
        $set: {
          refreshTokenId
        }
      }
    );

    return res.send({
      name: profile.name,
      email: req.body.email,
      statusMessage: "Successfully logged in",
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.log(error);
    return res.status(401).send({
      statusMessage: "Could not log in. Email or password is incorrect."
    });
  }
});

export default router;
