//load the environment variables
require('dotenv').config();

//dependencies
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const routes = require('./routes/routes');

const PORT = 8000;
const PASSWORD = process.env.DB_PASS;
const URI = `mongodb+srv://thysis:${PASSWORD}@fridge-monitor-cluster.1rrvrzd.mongodb.net/?appName=Fridge-Monitor-Cluster`;

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/api', routes);

//connect to database
mongoose.connect(URI)
    .then(() => {
        console.log("Successfully connected to DB!");

        //start server
        app.listen(PORT, (error) => {
            if (error) {
                console.log(`Server initialization on port http://localhost:${PORT} failed.`);
            } else {
                console.log(`Server is running on port http://localhost:${PORT}.`);
            }
        });
    })
    .catch(error => {
        console.error("Failed to connect to DB: ", error)
        process.exit(1);
    });