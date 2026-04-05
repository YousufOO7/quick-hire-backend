const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:3000", "https://quick-hire-mu-ruddy.vercel.app"],
    credentials: true,
  }),
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6mmiv.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const allJobsCollection = client.db("smart_hospital").collection("allJobs");
    const allJobsApplications = client
      .db("smart_hospital")
      .collection("jobsApplications");

    app.get("/allJobs", async (req, res) => {
      const result = await allJobsCollection.find().toArray();
      res.send(result);
    });

    app.get("/allJobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await allJobsCollection.findOne(query);
      res.send(result);
    });

    app.post("/add-jobs", async (req, res) => {
      const addJobs = req.body;
      const result = await allJobsCollection.insertOne(addJobs);
      res.send(result);
    });

    app.post("/applications", async (req, res) => {
      try {
        const { job_id, name, email, resume_link, cover_note } = req.body;

        // Required fields check
        if (!job_id || !name || !email || !resume_link || !cover_note) {
          return res.status(400).send({ message: "All fields are required" });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).send({ message: "Invalid email format" });
        }

        // URL validation
        try {
          new URL(resume_link);
        } catch {
          return res.status(400).send({ message: "Invalid resume link" });
        }

        // Final object (controlled)
        const application = {
          job_id,
          name,
          email,
          resume_link,
          cover_note,
          created_at: new Date(),
        };

        const result = await allJobsApplications.insertOne(application);

        res.status(201).send({
          success: true,
          message: "Application submitted successfully",
          data: result,
        });
      } catch (error) {
        console.error("Application error:", error);
        res.status(500).send({
          message: "Internal server error",
        });
      }
    });

    app.get("/allJobsApplications", async (req, res) => {
      const result = await allJobsApplications.find().toArray();
      res.send(result);
    });

    app.delete("/add-jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await allJobsCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Quick server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
