const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dgfkb.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect()

        // all collection
        const partsCollection = client.db('assignment12').collection('parts')
        const reviewsCollection = client.db('assignment12').collection('reviews')
        const ordersCollection = client.db('assignment12').collection('orders')

        // all get api
        app.get('/parts', async (req, res) => {
            const parts = await partsCollection.find().toArray()
            res.send(parts)
        })

        app.get('/parts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await partsCollection.findOne(query);
            res.send(result)
        })

        app.get('/reviews', async (req, res) => {
            const reviews = (await reviewsCollection.find().toArray()).reverse()
            res.send(reviews)
        })

        app.get('/myOrders', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = ordersCollection.find(query)
            const myOrders = await cursor.toArray()
            res.send(myOrders)
        })


        // all post api
        app.post('/reviews', async (req, res) => {
            const newReviews = req.body;
            const result = await reviewsCollection.insertOne(newReviews);
            res.send(result);
        })

        app.post('/orders', async (req, res) => {
            const newOrders = req.body;
            const result = await ordersCollection.insertOne(newOrders)
            res.send(result)
        })

        // all delete api
        app.delete('/myOrders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await ordersCollection.deleteOne(query)
            res.send(result)
        })


    }
    finally {

    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('running assignment 12 server')
})
app.listen(port, () => {
    console.log("Listening to port", port);
})