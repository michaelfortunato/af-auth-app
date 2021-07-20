const express = require("express");
const { MongoClient } = require("mongodb");
const redis = require("redis");
const { promisify } = require("util");
const login = require("./login");
const signup = require("./signup");
const refresh_token = require("./refresh_token");
const { initAuth } = require("./auth");

const app = express();
const port = process.env.PORT || 8080;

// MongoDB connection string build
const MONGO_PORT = 27017;
const MONGO_PRIMARY_IP_0 = process.env.MONGO_PRIMARY_IP_0;
const MONGO_SECONDARY_IP_0 = process.env.MONGO_SECONDARY_IP_0;
const MONGO_SECONDARY_IP_1 = process.env.MONGO_SECONDARY_IP_1;
const MONGO_USERNAME = process.env.MONGO_USERNAME;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;
const MONGO_AUTH_DB = process.env.MONGO_AUTH_DB;
const REPLICA_SET = process.env.REPLICA_SET;
const PRIMARY_DB = process.env.PRIMARY_DB

const connectionString =
  `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_PRIMARY_IP_0}:${MONGO_PORT},` +
  `${MONGO_SECONDARY_IP_0}:${MONGO_PORT},` +
  `${MONGO_SECONDARY_IP_1}:${MONGO_PORT}` +
  `/?authSource=${MONGO_AUTH_DB}&replicaSet=${REPLICA_SET}`;

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

    await mongodb_client.connect();
    app.locals.database = mongodb_client.db(PRIMARY_DB);

    initAuth();
    app.use(express.json());
    app.use("/signup", signup);
    app.use("/login", login);
    app.use("/refresh-token", refresh_token);
    app.listen(port, () => console.log(`Listening on port ${port}`));
  } catch (error) {
    console.log(error);
    console.log("Could not start auth service");
  }
}
main();
