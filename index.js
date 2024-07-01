const express = require("express");
const cors = require("cors");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { ObjectId } = require("mongodb");

const crypto = require("crypto");

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

// Function to hash password
const hashPassword = async (password) => {
	const salt = await bcrypt.genSalt(10);
	return bcrypt.hash(password, salt);
};

// Middleware to verify JWT token
const verifyJWT = (req, res, next) => {
	const authorization = req.headers.authorization;
	if (!authorization) {
		console.error("No authorization header");
		return res
			.status(401)
			.send({ error: true, message: "unauthorized access" });
	}

	const token = authorization.split(" ")[1];
	jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
		if (err) {
			console.error("Token verification failed:", err);
			return res
				.status(401)
				.send({ error: true, message: "unauthorized access" });
		}
		req.decoded = decoded;
		next();
	});
};

// Connect to MongoDB and start server
async function run() {
	try {
		await client.connect();
		const db = client.db("portfolioDB");
		const portfolioCollection = db.collection("portfolios");
		const resumeCollection = db.collection("resume");
		const contactCollection = db.collection("contact");
		const skillsCollection = db.collection("skills");
		const statsCollection = db.collection("stats");
		const usersCollection = db.collection("users");
		const blogsCollection = db.collection("blogs");

		const secretKey = crypto.randomBytes(64).toString("hex");
		console.log(secretKey);

		const verifyAdmin = async (req, res, next) => {
			const email = req.decoded.email;
			const query = { email: email };
			const user = await usersCollection.findOne(query);
			if (user?.role !== "admin") {
				return res
					.status(403)
					.send({ error: true, message: "forbidden message" });
			}
			next();
		};

		app.post("/jwt", (req, res) => {
			const user = req.body;
			const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
				expiresIn: "1h",
			});
			res.send({ token });
		});

		app.get("/api/users", async (req, res) => {
			try {
				const result = await usersCollection.find().toArray();
				res.send(result);
			} catch (error) {
				console.error("Error fetching users:", error);
				res.status(500).send({
					error: true,
					message: "Failed to fetch users",
				});
			}
		});

		app.post("/api/users", async (req, res) => {
			const user = req.body;
			const query = { email: user.email };
			const existingUser = await usersCollection.findOne(query);
			if (existingUser) {
				return res.status(409).json({ message: "User Already Exists" });
			}
			const result = await usersCollection.insertOne(user);
			const token = jwt.sign(
				{ email: user.email },
				process.env.ACCESS_TOKEN,
				{ expiresIn: "1h" }
			);
			res.status(201).json({ result, token });
		});

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

		app.post("/api/resume", async (req, res) => {
			const newItem = req.body;
			const result = await resumeCollection.insertOne(newItem);
			res.send(result);
		});

		app.delete("/api/resume/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await resumeCollection.deleteOne(query);
			res.send(result);
		});

		app.put("/api/resume/:id", async (req, res) => {
			const id = req.params.id;
			const updatedResume = req.body;
			try {
				const query = { _id: new ObjectId(id) };
				const updateDocument = {
					$set: updatedResume,
				};
				const result = await resumeCollection.updateOne(
					query,
					updateDocument
				);
				if (result.matchedCount === 0) {
					res.status(404).json({ message: "Resume not found" });
				} else {
					res.json(result);
				}
			} catch (error) {
				res.status(500).json({ error: "Error updating Resume" });
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

		app.post("/api/portfolios", async (req, res) => {
			const newItem = req.body;
			const result = await portfolioCollection.insertOne(newItem);
			res.send(result);
		});

		app.delete("/api/portfolios/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };

			const result = await portfolioCollection.deleteOne(query);
			res.send(result);
		});

		app.put("/api/portfolios/:id", async (req, res) => {
			const id = req.params.id;
			const updatedPortfolio = req.body;
			try {
				const query = { _id: new ObjectId(id) };
				const updateDocument = {
					$set: updatedPortfolio,
				};
				const result = await portfolioCollection.updateOne(
					query,
					updateDocument
				);
				if (result.matchedCount === 0) {
					res.status(404).json({ message: "Portfolio not found" });
				} else {
					res.json(result);
				}
			} catch (error) {
				res.status(500).json({ error: "Error updating Portfolio" });
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

		app.post("/api/skills", async (req, res) => {
			const newItem = req.body;
			const result = await skillsCollection.insertOne(newItem);
			res.send(result);
		});

		app.delete("/api/skills/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await skillsCollection.deleteOne(query);
			res.send(result);
		});

		app.put("/api/skills/:id", async (req, res) => {
			const id = req.params.id;
			const updatedSkill = req.body;
			try {
				const query = { _id: new ObjectId(id) };
				const updateDocument = {
					$set: updatedSkill,
				};
				const result = await skillsCollection.updateOne(
					query,
					updateDocument
				);
				if (result.matchedCount === 0) {
					res.status(404).json({ message: "Skill not found" });
				} else {
					res.json(result);
				}
			} catch (error) {
				res.status(500).json({ error: "Error updating skill" });
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

		app.post("/api/contact", async (req, res) => {
			const contact = req.body;
			const result = await contactCollection.insertOne(contact);
			res.send(result);
		});

		app.get("/api/blogs", async (req, res) => {
			try {
				const contact = await blogsCollection.find().toArray();
				res.json(contact);
			} catch (error) {
				console.error("Error fetching portfolios", error);
				res.status(500).json({ error: "Error fetching portfolios" });
			}
		});

		app.post("/api/blogs", async (req, res) => {
			const contact = req.body;
			const result = await blogsCollection.insertOne(contact);
			res.send(result);
		});

		await client.db("admin").command({ ping: 1 });
		console.log(
			"Pinged your deployment. You successfully connected to MongoDB!"
		);

		app.get("/api/protected", verifyJWT, (req, res) => {
			res.json({ message: "Access granted", user: req.decoded });
		});

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
