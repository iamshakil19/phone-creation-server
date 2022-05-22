const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors());
app.use(express.json())

app.get('/', (req, res) => {
    res.send('running genius server')
})
app.listen(port, () => {
    console.log("Listening to port", port);
})