const express = require('express');
const { MongoClient } = require('mongodb');
const login = require('./login')
const { initAuth } = require('./auth');
const app = express()
const port = process.env.PORT || 8080;
 
const database_url = process.env.database_url || "192.168.49.2" ;
const database_port = process.env.database_port || 30001;
const database_name = "AR"

 
const username = "username";
const password = "password";
 
initAuth(); 
MongoClient.connect(`mongodb://${username}:${password}@${database_url}:${database_port}`, (error, client) => {
    if(error) throw error;
    app.locals.database = client.db(database_name);
    app.use("/login", login);
    app.listen(port, () => console.log(`Listening on port ${port}`));

});
process.on('SIGINT', () => { console.log("Bye bye!"); process.exit(); });
 