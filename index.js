const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const port = 5000;

require('dotenv').config();

app.use(express.json());

app.get('/', (req, res) => {
	res.status(200).send('Service Review server is running...');
});

const client = new MongoClient(process.env.MONGO_URI);

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

	app.get('/reviews', async (req, res) => {
		const query = {};
		const cursor = reviewCollection.find(query);
		const reviews = await cursor.toArray();
		res.send(reviews);
	});
}

crudOperation();

app.listen(port, () => console.log('Listening on port', port));