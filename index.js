const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
        const packageCollection = client
            .db("career-club")
            .collection("packages");
        const categoryCollection = client
            .db("career-club")
            .collection("categories");

        /* ----------------------GET API----------------------------- */
        // get user role
        app.get("/userRole/:email", async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const result = await usersCollection.findOne(filter);
            res.send({ status: true, data: result?.role });
        });

        // get all packages
        app.get("/package", async (req, res) => {
            const filter = {};
            const result = await packageCollection.find(filter).toArray();
            res.send({ status: true, data: result });
        });

        // get package by id
        app.get("/package/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await packageCollection.findOne(filter);
            res.send({ status: true, data: result });
        });

        // get all categories
        app.get("/category", async (req, res) => {
            const filter = {};
            const result = await categoryCollection.find(filter).toArray();
            res.send({ status: true, data: result });
        });

        /* ----------------------POST API----------------------------- */

        // post package
        app.post("/package", async (req, res) => {
            const package = req.body;
            const result = await packageCollection.insertOne(package);
            res.send({ status: true, data: result });
        });

        // post category
        app.post("/category", async (req, res) => {
            const category = req.body;
            const result = await categoryCollection.insertOne(category);
            res.send({ status: true, data: result });
        });

        /* ----------------------PUT API----------------------------- */

        // save user in the db
        app.put("/user/:email", async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const doc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(
                filter,
                doc,
                options
            );
            res.send({ status: true, data: result });
        });

        /* ----------------------PATCH API----------------------------- */

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

        // set User verify status
        app.patch("/verifyStatus/:email", async (req, res) => {
            const email = req.params.email;
            const isVerified = req.body;
            const filter = { email: email };

            const options = { upsert: false };
            const doc = {
                $set: { isVerified: isVerified.isVerified },
            };
            const result = await usersCollection.updateOne(
                filter,
                doc,
                options
            );

            res.send({ result });
        });

        // update package details
        app.patch("/package/:id", async (req, res) => {
            const id = req.params.id;
            const updatedPackage = req.body;
            console.log(id, updatedPackage);
            const filter = { _id: ObjectId(id) };
            const options = { upsert: false };
            const doc = {
                $set: updatedPackage,
            };

            const result = await packageCollection.updateMany(
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
