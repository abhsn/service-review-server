const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const jwt = require('jsonwebtoken');
const port = 5000;

require('dotenv').config();

app.use(express.json());

app.get('/', (req, res) => {
	res.status(200).send('Service Review server is running...');
});

const client = new MongoClient(process.env.MONGO_URI);

const verifyJWT = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		res.status(401).send({ message: 'Unauthorized Access' });
	} else {
		const token = req.headers.authorization.split(' ')[1];
		jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
			if (!err) {
				req.decoded = decoded;
				next();
			} else {
				res.status(401).send({ message: 'Unauthorized Access' });
			}
		});
	}
};

async function crudOperation() {
	const serviceCollection = client.db("service-review").collection("service-list");
	const reviewCollection = client.db("service-review").collection("reviews");

	app.get('/services', async (req, res) => {
		const query = {};
		const limit = 3;
		if (req.headers.isshort) {
			const cursor = serviceCollection.find(query).limit(limit);
			const services = await cursor.toArray();
			res.send(services);
		} else {
			const cursor = serviceCollection.find(query);
			const services = await cursor.toArray();
			res.send(services);
		}
	});

	app.get('/services/:id', async (req, res) => {
		if (req.params.id.length !== 24 || !/^[a-fA-F0-9]+$/.test(req.params.id)) {
			res.status(404).send('Not Found');
		} else {
			const query = { _id: ObjectId(req.params.id) };
			const service = await serviceCollection.findOne(query);
			if (service) {
				res.send(service);
			} else {
				res.status(404).send('Not Found');
			}
		}
	});

	app.get('/reviews/:id', async (req, res) => {
		const id = req.params.id;
		const query = { serviceId: id };
		const cursor = reviewCollection.find(query);
		const reviews = await cursor.toArray();
		res.send(reviews);
	});

	app.post('/jwt', (req, res) => {
		const user = req.body;
		const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" })
		res.send({ token });
	});

	app.get('/my-reviews/:id', verifyJWT, async (req, res) => {
		const id = req.params.id;
		const query = { uid: id };
		const cursor = reviewCollection.find(query);
		const reviews = await cursor.toArray();
		res.send(reviews);
	});

	app.put('/edit-review/:id', async (req, res) => {
		const decoded = req.decoded;
		const id = req.params.id;
		console.log(id);
	});
}

crudOperation();

app.listen(port, () => console.log('Listening on port', port));