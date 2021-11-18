/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
import express from "express";
import { MongoClient } from "mongodb";
import {
  MONGO_CLUSTER_ENDPOINT,
  MONGO_PORT,
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_AUTH_DB,
  REPLICA_SET_QUERY_PARAMETER,
  AUTH_APP_SERVICE_SERVICE_PORT
} from "./secrets";
import signup from "./signup";
import login from "./login";
import logout from "./logout";
import generateTokenPair from "./generateTokenPair";

const app = express();
// process.env.NODE_ENV !== "development" ? 8080 : 8081;

// MongoDB connection string build
const connectionString =
  `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_CLUSTER_ENDPOINT}:${MONGO_PORT}` +
  `/?authSource=admin${REPLICA_SET_QUERY_PARAMETER}&retryWrites=false`;
// "rc-chart-redis-master" //"rc-chart-redis-master.default.svc.cluster.local"

async function main() {
  console.log(connectionString);
  try {
    app.locals.mongoDBClient = await new MongoClient(connectionString, {
      useUnifiedTopology: true
    }).connect();
    console.log("Connected to database! 🦄");
    app.locals.database = app.locals.mongoDBClient.db(MONGO_AUTH_DB);

    app.use(express.json());
    app.use("/signup", signup);
    app.use("/login", login);
    app.use("/logout", logout);
    app.use("/generate_token_pair", generateTokenPair);
    app.get("/testy", async () => {
      console.log("ok");
    });
    app.listen(AUTH_APP_SERVICE_SERVICE_PORT, () =>
      console.log(`Listening on port ${AUTH_APP_SERVICE_SERVICE_PORT}`)
    );
  } catch (error) {
    console.log(error);
    console.log("Could not start auth service");
  }
}
main();
