const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 4000
require("dotenv").config();

// middleware
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('edutainment toys server is running')
})



// Mongodb 
// for 4.1 or later
const uri = `mongodb+srv://${process.env.EDUTAINMENT_TOYS_DB_USER}:${process.env.EDUTAINMENT_TOYS_DB_PASS}@cluster0.iw4kl2c.mongodb.net/?retryWrites=true&w=majority`;
// for 2.2.12 or later
// var uri = `mongodb://${process.env.EDUTAINMENT_TOYS_DB_USER}:${process.env.EDUTAINMENT_TOYS_DB_PASS}@ac-sdycgbe-shard-00-00.iw4kl2c.mongodb.net:27017,ac-sdycgbe-shard-00-01.iw4kl2c.mongodb.net:27017,ac-sdycgbe-shard-00-02.iw4kl2c.mongodb.net:27017/?ssl=true&replicaSet=atlas-12xt4i-shard-0&authSource=admin&retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });

        const edutainmentDB = client.db('edutainment-db')
        const toyCollection = edutainmentDB.collection('toy-collection')
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        // Add a toy
        app.post('/add-toy', async (req, res) => {
            let toyInfo = req.body
            console.log(toyInfo);
            const result = await toyCollection.insertOne(toyInfo)
            res.send(result)
        })

        //** Get data from mongodb

        // get my toy
        // app.get('/my-toys', async (req, res) => {
        //     if (!req.query?.email) {
        //         res.send([])
        //         return
        //     }
        //     let query = req.query?.email
        //     let find = { sellerEmail: query }
        //     const result = await toyCollection.find(find).toArray()
        //     res.send(result)
        // })

        // get sorting toy ascending or descending order (if don't provide query parameter for sorting then send all toys)
        app.get('/my-toys-sort', async (req, res) => {

            if (!req.query?.email) {
                res.send([])
                return
            }

            let { sort, email } = req.query
            let sortOption = {}
            if (sort === 'lowToHigh') {
                sortOption = { price: 1 }  // ascending order
            }
            else if (sort === 'highToLow') {
                sortOption = { price: -1 }  //descending order
            }
            const find = { sellerEmail: email }

            const result = await toyCollection.find(find).sort(sortOption).toArray()
            res.send(result)
        })

        // get all toy
        app.get('/toys', async (req, res) => {

            if (req.query?.search) {
                let searchQuery = req.query?.search

                const find = { toyName: { $regex: new RegExp(searchQuery, 'i') } };
                const result = await toyCollection.find(find).toArray();

                res.send(result)
                return
            }

            const result = await toyCollection.find({}).limit(20).toArray()
            res.send(result)
        })

        // get signle toy
        app.get('/toys/:id', async (req, res) => {
            const id = req.params.id
            const find = { _id: new ObjectId(id) }
            const result = await toyCollection.findOne(find)
            res.send(result)
        })

        //  update toy
        app.post('/update-toy/:id', async (req, res) => {
            const uniqueId = req.params.id
            const updateToyInfo = req.body
            const { price, availableQuantity, description } = updateToyInfo
            const find = { _id: new ObjectId(uniqueId) }
            const options = { upsert: true };
            const updatedToy = {
                $set: {
                    price, availableQuantity, description
                },
            };
            const result = await toyCollection.updateOne(find, updatedToy, options)
            res.send(result)
        })

        // remove single toy
        app.delete('/delete-toy/:id', async (req, res) => {
            const uniqueId = req.params.id
            const find = { _id: new ObjectId(uniqueId) }
            const result = await toyCollection.deleteOne(find)
            res.send(result)
        })


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log('Server is running perfectly!');
})