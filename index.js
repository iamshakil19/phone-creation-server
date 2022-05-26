const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const stripe = require('stripe')("sk_test_51L1AeqHfb8VoLvD9wkDKJ6BbEPBkhJtUouDuHb6hPR1jbPBfVjA41sQaCjQAihLzlhjzm6tivmNJ2slGO68s6H7m00K7WEcjF5")
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const query = require('express/lib/middleware/query');

app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dgfkb.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
    try {
        await client.connect()

        // all collection
        const userCollection = client.db('assignment12').collection('user')
        const partsCollection = client.db('assignment12').collection('parts')
        const reviewsCollection = client.db('assignment12').collection('reviews')
        const ordersCollection = client.db('assignment12').collection('orders')
        const paymentsCollection = client.db('assignment12').collection('payments')


        function jwtToken(req, res, next) {
            const authHeader = req.headers.authorization
            if (!authHeader) {
                return res.status(401).send({ message: 'UnAuthorized access' })
            }
            const token = authHeader.split(' ')[1]
            jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
                if (err) {
                    return res.status(403).send({ message: 'Forbidden access' })
                }
                req.decoded = decoded
                next()
            })
        }


        // all get api
        app.get('/parts', async (req, res) => {
            const parts = (await partsCollection.find().toArray()).reverse()
            res.send(parts)
        })

        app.get('/orders', async (req, res) => {
            const parts = await ordersCollection.find().toArray()
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

        app.get('/order/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const singleOrder = await ordersCollection.findOne(query)
            res.send(singleOrder)
        })

        app.get('/myOrders', jwtToken, async (req, res) => {
            const decodedEmail = req.decoded.email
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = ordersCollection.find(query)
                const myOrders = await cursor.toArray()
                return res.send(myOrders)
            }
            else {
                res.status(403).send({ message: 'forbidden access' })
            }

        })

        app.get('/users', jwtToken, async (req, res) => {
            const users = await userCollection.find().toArray()
            res.send(users)
        })

        app.get('/user/:email', async (req, res) => {
            const email = req.params.email 
            const users = await userCollection.findOne({email: email})
            res.send(users)
        })

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email })
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })


        // all post api
        app.post('/reviews', async (req, res) => {
            const newReviews = req.body;
            const result = await reviewsCollection.insertOne(newReviews);
            res.send(result);
        })

        app.post('/parts', jwtToken, async (req, res) => {
            const newParts = req.body;
            const result = await partsCollection.insertOne(newParts);
            res.send(result);
        })

        app.post('/orders', async (req, res) => {
            const newOrders = req.body;
            const result = await ordersCollection.insertOne(newOrders)
            res.send(result)
        })

        app.post('/create-payment-intent', async (req, res) => {
            const { totalCost } = req.body
            const amount = parseInt(totalCost) * 100
            console.log(amount, totalCost);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            })
            console.log({ clientSecret: paymentIntent.client_secret })
            res.send({ clientSecret: paymentIntent.client_secret })
        })

        // all delete api
        app.delete('/myOrders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await ordersCollection.deleteOne(query)
            res.send(result)
        })

        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })

        app.delete('/parts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await partsCollection.deleteOne(query)
            res.send(result)
        })

        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await ordersCollection.deleteOne(query)
            res.send(result)
        })

        // all put api
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body
            const filter = { email: email };
            const options = { upsert: true }

            const updateDoc = {
                $set: user,
            }
            const result = await userCollection.updateOne(filter, updateDoc, options)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '7d' })
            res.send({ result, token })
        })

        app.patch('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body
            const filter = { email: email };
            const updateDoc = {
                $set: user,
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            if (result.acknowledged) {
                res.send({ success: true, message: "Profile Updated" })
            }
        })

        app.put('/user/admin/:email', jwtToken, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester })
            if (requesterAccount.role === "admin") {
            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' },
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        }
        else {
            res.status(403).send({ message: 'forbidden' })
        }

        })

        // all patch api
        app.patch('/myOrders/:id', jwtToken, async (req, res) => {
            const id = req.params.id;
            const payment = req.body
            console.log(payment);
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId,
                    status: payment.status
                }
            }

            const updatedOrder = await ordersCollection.updateOne(filter, updatedDoc)

            const result = await paymentsCollection.insertOne(payment)
            res.send(updatedDoc);
        })

        app.patch('/orderStatus/:id', jwtToken, async (req, res) => {
            const id = req.params.id;
            const payment = req.body
            console.log(payment);
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: payment.status
                }
            }

            const updatedOrder = await ordersCollection.updateOne(filter, updatedDoc)

            const result = await paymentsCollection.insertOne(payment)
            res.send(updatedDoc);
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