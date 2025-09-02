const express = require('express');
const app = express()
require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5000

// middlewire
app.use(cors())
app.use(express.json())




const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pdx5h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        const jobsCollection = client.db("taskNest").collection('jobs')
        const appliedJobCollection = client.db("taskNest").collection('applied')
       
        await client.connect();

        // Adda job
        app.post('/jobs', async(req,res)=>{
            const jobs = req.body;
            const result = await jobsCollection.insertOne(jobs)
            res.send(result)
        })

        // get all jobs 
        app.get('/jobs', async(req,res)=>{
            const result = await jobsCollection.find().toArray()
            res.send(result)
        })

        // get a single user job
        app.get('/jobs/:email', async(req,res)=>{
            const email = req.params.email;
            const query = {buyerEmail:email}
            const result = await jobsCollection.find(query).toArray()
            res.send(result)
        })

        // find a single job to update
        app.get('/jobs/update/:id', async(req,res)=>{
            const id = req.params.id;
            
            const query = {_id : new ObjectId(id)}
            const result = await jobsCollection.findOne(query)
            
            res.send(result)
        })

        // update a job
        app.patch('/jobs/update/:id', async(req,res)=>{
            const job = req.body;
            
            const id = req.params.id
            const query = { _id : new ObjectId(id)}
            const updatedDoc = {
                $set:{
                    ...job
                }
            }
            const result = await jobsCollection.updateOne(query,updatedDoc)
            res.send(result)
        })

        // Delete a job
        app.delete('/jobs/delete/:id', async(req,res)=>{
            const id = req.params.id;
            const query = { _id : new ObjectId(id)}
            const result = await jobsCollection.deleteOne(query)
            res.send(result)
        })


        // // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
  
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Task Nest is running')
})

app.listen(port, () => {
    console.log(`Ser running on port ${port}`);
})