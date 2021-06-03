const express = require("express");
const { MongoClient } = require("mongodb");
const redis = require("redis");
const { promisify } = require("util");
const login = require("./login");
const signup = require("./signup");
const { initAuth } = require("./auth");

const app = express();
const port = process.env.PORT || 8080;

const database_url = process.env.MONGODB_SERVICE_SERVICE_HOST || "localhost";
const database_port = process.env.MONGODB_SERVICE_SERVICE_PORT || 30000; // Use this as the dev port 
const database_name = "AR";
const username = process.env.MONGO_INITDB_ROOT_USERNAME || "username";
const password = process.env.MONGO_INITDB_ROOT_PASSWORD || "password";

const cache_master_url = process.env.REDIS_MASTER_HOST || "127.0.0.1"; // "rc-chart-redis-master" //"rc-chart-redis-master.default.svc.cluster.local"
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
    const mongodb_client = new MongoClient(
      `mongodb://${username}:${password}@${database_url}:${database_port}`,
      { useUnifiedTopology: true }
    );
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
    app.locals.database = mongodb_client.db(database_name);

    initAuth();
    app.use(express.json());
    app.use("/login", login);
    app.use("/signup", signup);
    app.listen(port, () => console.log(`Listening on port ${port}`));
  } catch (error) {
    console.log(error)
    console.log("Could not start auth service");
  }
}
main();
