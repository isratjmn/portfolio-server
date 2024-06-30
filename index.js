const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uri = `mongodb+srv://${encodeURIComponent(
	process.env.DB_USER
)}:${encodeURIComponent(
	process.env.DB_PASS
)}@cluster0.ocimcqo.mongodb.net/portfolioDB?retryWrites=true&w=majority`;

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
		const db = client.db("portfolioDB");
		const portfolioCollection = db.collection("portfolios");
		const resumeCollection = db.collection("resume");
		const contactCollection = db.collection("contact");
		const skillsCollection = db.collection("skills");
		const statsCollection = db.collection("stats");
		app.get("/api/stats", async (req, res) => {
			try {
				const stats = await statsCollection.find().toArray();
				res.json(stats);
			} catch (error) {
				console.error("Error fetching stats", error);
				res.status(500).json({ error: "Error fetching stats" });
			}
		});

		app.get("/api/resume", async (req, res) => {
			try {
				const resume = await resumeCollection.find().toArray();
				res.json(resume);
			} catch (error) {
				console.error("Error fetching resume", error);
				res.status(500).json({ error: "Error fetching resume" });
			}
		});

		app.get("/api/portfolios", async (req, res) => {
			try {
				const portfolios = await portfolioCollection.find().toArray();
				res.json(portfolios);
			} catch (error) {
				console.error("Error fetching portfolios", error);
				res.status(500).json({ error: "Error fetching portfolios" });
			}
		});
		app.get("/api/skills", async (req, res) => {
			try {
				const skills = await skillsCollection.find().toArray();
				res.json(skills);
			} catch (error) {
				console.error("Error fetching portfolios", error);
				res.status(500).json({ error: "Error fetching portfolios" });
			}
		});
		app.get("/api/contact", async (req, res) => {
			try {
				const contact = await contactCollection.find().toArray();
				res.json(contact);
			} catch (error) {
				console.error("Error fetching portfolios", error);
				res.status(500).json({ error: "Error fetching portfolios" });
			}
		});

		await client.db("admin").command({ ping: 1 });
		console.log(
			"Pinged your deployment. You successfully connected to MongoDB!"
		);

		app.get("/", (req, res) => {
			res.send(`Portfolio is running on port ${port}`);
		});

		app.listen(port, () => {
			console.log(`Portfolio is running on port ${port}`);
		});
	} catch (error) {
		console.error("Connection error", error);
	}
}

run().catch(console.error);
