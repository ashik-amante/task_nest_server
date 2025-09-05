const express = require('express');
const app = express()
require('dotenv').config()
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 5000

// middlewire
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200
}))
app.use(express.json())
app.use(cookieParser())






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
        const applicationCollection = client.db("taskNest").collection('applications')

        await client.connect();

        // jwt
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
            }).send({ success: true })
        })

        // logout
        app.get('/logout', (req, res) => {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 0
            }).send({ success: true })
        })

        // verify token 
        const verifyToken = (req, res, next) => {
            const token = req.cookies?.token;
            if (!token) {
                return res.status(401).send({ message: 'Unauthorize access' })
            }

            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(403).send({ message: 'Forbidden access' })
                }
                req.user = decoded
                next()
            })

        }

        // Adda job
        app.post('/jobs', async (req, res) => {
            const jobs = req.body;
            const result = await jobsCollection.insertOne(jobs)
            res.send(result)
        })

        // get all jobs 
        app.get('/jobs', async (req, res) => {
            const result = await jobsCollection.find().toArray()
            res.send(result)
        })

        // get an user's posted job
        app.get('/jobs/myposted-jobs/:email', verifyToken, async (req, res) => {
            const tokenEmail = req.user.email
        console.log(tokenEmail);
            const email = req.params.email;
            if(email !== tokenEmail){
                return res.status(403).send({message: "forbidden acess"})
            }
            const query = { 'buyer.email': email }
            const result = await jobsCollection.find(query).toArray()
            res.send(result)
        })


        // find a single job to update
        app.get('/jobs/update/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.findOne(query)

            res.send(result)
        })

        // update a job
        app.patch('/jobs/update/:id', async (req, res) => {
            const job = req.body;

            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    ...job
                }
            }
            const result = await jobsCollection.updateOne(query, updatedDoc)
            res.send(result)
        })

        // Delete a job
        app.delete('/jobs/delete/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await jobsCollection.deleteOne(query)
            res.send(result)
        })

        // Applications realted api
        app.post('/applications', async (req, res) => {
            const application = req.body
            const { jobId, email } = application

            const isApplied = await applicationCollection.findOne({ jobId })
            console.log(isApplied);
            if (isApplied) {
                return res.status(400).send("You've already applied on this job")
            }
            const result = await applicationCollection.insertOne(application)

            // now increment total applicant in job collection
            await jobsCollection.updateOne(
                { _id: new ObjectId(jobId) },
                { $inc: { totalApplicant: 1 } }
            )
            res.send(result)
        })

        // get my applied jobs
        app.get('/myapplied-jobs/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await applicationCollection.find(query).toArray()
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