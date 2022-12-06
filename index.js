const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// define port
const port = process.env.PORT || 5000;

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// database setup
const uri = process.env.DB_URI;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

async function run() {
    try {
        // all collection
        const usersCollection = client.db("career-club").collection("users");

        // save user in the db
        app.post("/user", async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send({ status: true, data: result });
        });

        // set User role
        app.patch("/userRole/:email", async (req, res) => {
            const email = req.params.email;
            const role = req.body;
            const filter = { email: email };

            const options = { upsert: false };
            const doc = {
                $set: { role: role.role },
            };
            const result = await usersCollection.updateOne(
                filter,
                doc,
                options
            );

            res.send({ status: true, data: result });
        });
    } finally {
    }
}
run().catch((err) => console.log(err));

// all collection
const usersCollection = client.db("career-club").collection("users");

app.get("/", (req, res) => {
    res.send("Server is running!");
});

// listen port
app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});