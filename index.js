const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
        const paymentCollection = client
            .db("career-club")
            .collection("payments");
        const jobCollection = client.db("career-club").collection("jobs");

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

        // get category by id
        app.get("/category/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await categoryCollection.findOne(filter);
            res.send({ status: true, data: result });
        });

        // get users current package number
        app.get("/postNumber/:email", async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const result = await usersCollection.findOne(filter);
            res.send({ postNumber: result.postNumber });
        });

        // get all payment history
        app.get('/payments', async(req, res)=> {
            const result = await paymentCollection.find({}).toArray();
            res.send({status: true, data: result});
        })

        // get payments info for particular employer
        app.get("/payments/:email", async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const result = await paymentCollection.find(filter).toArray();
            res.send({ status: true, data: result });
        });

        // get employer job post by email
        app.get("/jobPost/:email", async (req, res) => {
            const email = req.params.email;
            const filter = { employer_email: email };
            const result = await jobCollection.find(filter).toArray();
            res.send({ status: true, data: result });
        });

        // get particular job by id
        app.get("/job/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await jobCollection.findOne(filter);
            res.send({ status: true, data: result });
        });

        // get jobs by their type
        app.get("/jobs/:type", async (req, res) => {
            const type = req.params.type;
            let filter = {};
            if (type == "approved") {
                filter = { isApproved: true };
            } else if (type == "disapproved") {
                filter = { isApproved: false };
            }
            const result = await jobCollection.find(filter).toArray();
            res.send({ status: true, data: result });
        });

        /* ----------------------POST API----------------------------- */

        // stripe payment
        app.post("/create-payment-intent", async (req, res) => {
            const pack = req.body;
            const price = pack.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: amount,
                payment_method_types: ["card"],
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

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

        // save payment info on db
        app.post("/payment", async (req, res) => {
            const payment = req.body;
            const result = await paymentCollection.insertOne(payment);
            res.send({ status: true, data: result });
        });

        // save job post info on db
        app.post("/jobs", async (req, res) => {
            const job = req.body;
            const result = await jobCollection.insertOne(job);
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

        // update employer post package number
        app.patch("/postNumber/:email", async (req, res) => {
            const email = req.params.email;
            const postNumber = req.body;
            // console.log(postNumber);
            const filter = { email: email };
            const options = { upsert: false };
            const doc = {
                $set: { postNumber: postNumber.postNumber },
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
            const filter = { _id: ObjectId(id) };
            const options = { upsert: false };
            const doc = {
                $set: updatedPackage,
            };

            const result = await packageCollection.updateOne(
                filter,
                doc,
                options
            );
            res.send({ status: true, data: result });
        });

        // update category details
        app.patch("/category/:id", async (req, res) => {
            const id = req.params.id;
            const updatedCategory = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: false };
            const doc = { $set: updatedCategory };
            const result = await categoryCollection.updateOne(
                filter,
                doc,
                options
            );
            res.send({ status: true, data: result });
        });

        // update posted job
        app.patch("/job/:id", async (req, res) => {
            const id = req.params.id;
            const updatedJob = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: false };
            const doc = { $set: updatedJob };
            const result = await jobCollection.updateOne(filter, doc, options);
            if (result.matchedCount) {
                res.send({ status: true });
            } else {
                res.send({ status: false });
            }
        });

        // update job post verified status
        app.patch("/jobStatus/:id", async (req, res) => {
            const id = req.params.id;
            const status = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: false };
            const doc = { $set: { isApproved: status.status } };
            const result = await jobCollection.updateOne(filter, doc, options);
            if (result.matchedCount) {
                res.send({ status: true });
            } else {
                res.send({ status: false });
            }
        });

        /* ----------------------DELETE API----------------------------- */

        // delete package by id
        app.delete("/package/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await packageCollection.deleteOne(filter);
            if (result.deletedCount === 1) {
                res.send({ status: true });
            } else {
                res.send({ status: false });
            }
        });

        // delete category by id
        app.delete("/category/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await categoryCollection.deleteOne(filter);
            if (result.deletedCount) {
                res.send({ status: true });
            } else {
                res.send({ status: false });
            }
        });

        // delete job by id
        app.delete("/job/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await jobCollection.deleteOne(filter);
            if (result.deletedCount) {
                res.send({ status: true });
            } else {
                res.send({ status: false });
            }
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
