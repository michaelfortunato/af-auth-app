const express = require("express");
const { MongoClient } = require("mongodb");
const redis = require("redis");
const { promisify } = require("util");
const signup = require("./signup");
const login = require("./login");
const logout = require("./logout");
const generate_access_token = require("./generate_token_pair");
const { initAuth } = require("./auth");

const app = express();
const port = process.env.NODE_ENV !== "development" ? 8080 : 8081;

// MongoDB connection string build
const MONGO_PORT = 27017;
const MONGO_CLUSTER_ENDPOINT =
  process.env.NODE_ENV !== "development"
    ? process.env.MONGO_CLUSTER_ENDPOINT
    : "localhost";
const MONGO_USERNAME =
  process.env.NODE_ENV !== "development" ? process.env.MONGO_USERNAME : "authApp";
const MONGO_PASSWORD =
  process.env.NODE_ENV !== "development" ? process.env.MONGO_PASSWORD : "password";
const MONGO_AUTH_DB =
  process.env.NODE_ENV !== "development" ? process.env.MONGO_AUTH_DB : "authDB";
const REPLICA_SET =
  process.env.NODE_ENV !== "development" ? process.env.REPLICA_SET : "none";

// retryWrites being false is essential

const connectionString =
  process.env.NODE_ENV !== "development"
    ? `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_CLUSTER_ENDPOINT}:${MONGO_PORT}` +
      `/?authSource=admin&replicaSet=${REPLICA_SET}&retryWrites=false`
    : `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_CLUSTER_ENDPOINT}:${MONGO_PORT}` +
      `/?authSource=admin&retryWrites=false`;
// "rc-chart-redis-master" //"rc-chart-redis-master.default.svc.cluster.local"
const cache_master_url = process.env.REDIS_MASTER_HOST || "127.0.0.1";
const cache_master_port = process.env.REDIS_MASTER_PORT || 6379;
const cache_slave_url =
  process.env.REDIS_SLAVE_URL ||
  "rc-chart-redis-replicas.default.svc.cluster.local";
const cache_slave_port = process.env.REDIS_SLAVE_PORT || 6379;
const cache_password = "username";

const cache_retry = (options) => {
  if (options.error) {
    return new Error("Not retrying");
  }
};

async function main() {
  console.log(connectionString);
  try {
    const mongodb_client = new MongoClient(connectionString, {
      useUnifiedTopology: true,
    });
    const redis_master_client = redis.createClient({
      host: cache_master_url,
      port: cache_master_port,
      password: cache_password,
      retry_strategy: cache_retry,
    });
    // Add event listeners
    redis_master_client.on("connect", () => {
      console.log("Successfully connected to cache");
      app.locals.master_cache_get = promisify(redis_master_client.get).bind(
        redis_master_client
      );
      app.locals.master_cache_set = promisify(redis_master_client.set).bind(
        redis_master_client
      );
    });
    redis_master_client.on("reconnecting", () => {
      console.log("reconnecting");
    });
    redis_master_client.on("error", () => {
      app.locals.redis_master_client = null;
      console.log("Could not connect to cache");
    });

    app.locals.connected_mongo_client = await mongodb_client.connect();
    console.log("Connected to database! 🦄");

    app.locals.database = mongodb_client.db(MONGO_AUTH_DB);

    initAuth();
    app.use(express.json());
    app.use("/signup", signup);
    app.use("/login", login);
    app.use("/logout", logout);
    app.use("/generate_token_pair", generate_access_token);
    app.get("/testy", async (req, res) => {
      console.log("ok");
    });
    app.listen(port, () => console.log(`Listening on port ${port}`));
  } catch (error) {
    console.log(error);
    console.log("Could not start auth service");
  }
}
main();
