const express = require('express');
const { MongoClient } = require('mongodb');
const redis = require('redis');
const {promisify} = require('util')
const login = require('./login')
const { initAuth } = require('./auth');

const app = express()
const port = process.env.PORT || 8080;
 
const database_url = process.env.database_url || "192.168.49.2" ;
const database_port = process.env.database_port || 30001;
const database_name = "AR"
const username = "username";
const password = "password";

const cache_master_url = process.env.REDIS_MASTER_URL || "rc-chart-redis-master" //"rc-chart-redis-master.default.svc.cluster.local"
const cache_master_port = process.env.REDIS_MASTER_PORT || 6379;

const cache_slave_url = process.env.REDIS_SLAVE_URL || "rc-chart-redis-replicas.default.svc.cluster.local"
const cache_slave_port = process.env.REDIS_SLAVE_PORT || 6379;
const cache_password = "username"

const cache_retry = (options) => {
    if (options.error) {
        return new Error("Not retrying")
    }
}

async function main()  {
    const mongodb_client = new MongoClient(`mongodb://${username}:${password}@${database_url}:${database_port}`, {useUnifiedTopology: true});
    const redis_master_client = redis.createClient({
        host: cache_master_url, 
        port: cache_master_port, 
        password: cache_password,
        retry_strategy: cache_retry
    })
    // Add event listeners
    redis_master_client.on("connect", () => {
        console.log("able to connect to cache, performance enhance");
        app.locals.master_cache_get = promisify(redis_master_client.get).bind(redis_master_client)
        app.locals.master_cache_set = promisify(redis_master_client.set).bind(redis_master_client)
    })
    redis_master_client.on("reconnecting", () => {
        console.log("reconnecting")
    })
    redis_master_client.on("error", () => {
        app.locals.redis_master_client = null
        console.log("yeah no")
    })
    
    await mongodb_client.connect();
    app.locals.database = mongodb_client.db(database_name);
    
    initAuth() 
    app.use(express.json());
    app.use("/login", login);
    app.listen(port, () => console.log(`Listening on port ${port}`));
}
main();
/*
initAuth(); 
MongoClient.connect(`mongodb://${username}:${password}@${database_url}:${database_port}`, (error, client) => {
    if(error) throw error;
    app.locals.database = client.db(database_name);
    
    app.use(express.json());
    app.use("/login", login);
    app.listen(port, () => console.log(`Listening on port ${port}`));

});
*/
process.on('SIGINT', () => { console.log("Bye bye!"); process.exit(); });
 