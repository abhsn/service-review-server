const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const port = 5000;

app.use(cors());

require('dotenv').config();

app.use(express.json());

app.get('/', (req, res) => {
	res.status(200).send('Service Review server is running...');
});

const firebaseCredential = require(`./${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);

initializeApp({
	credential: admin.credential.cert(firebaseCredential)
})

const client = new MongoClient(process.env.MONGO_URI);

const verifyJWT = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		res.status(401).send({ message: 'Unauthorized Access' });
	} else {
		const token = req.headers.authorization.split(' ')[1];

		getAuth().verifyIdToken(token, true)
			.then(payload => {
				req.decoded = payload;
				next();
			})
			.catch(err => {
				if (err.code === 'auth/id-token-revoked') {
					res.status(401).send({ message: 'Unauthorized Access' });
				} else {
					res.status(401).send({ message: 'Unauthorized Access' });
				}
			})

		//		jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
		//			if (!err) {
		//				req.decoded = decoded;
		//				next();
		//			} else {
		//				res.status(401).send({ message: 'Unauthorized Access' });
		//			}
		//		});
	}
};

async function crudOperation() {
	const serviceCollection = client.db("service-review").collection("service-list");
	const reviewCollection = client.db("service-review").collection("reviews");

	// gets all services
	app.get('/services', async (req, res) => {
		const query = {};
		const limit = 3;
		// sends limited services
		if (req.headers.isshort) {
			const cursor = serviceCollection.find(query).limit(limit);
			const services = await cursor.toArray();
			res.send(services);
		}
		// sends full services
		else {
			const cursor = serviceCollection.find(query);
			const services = await cursor.toArray();
			res.send(services);
		}
	});

	// gets service details
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

	// get reviews for specific service
	app.get('/reviews/:id', async (req, res) => {
		// console.log(req.headers);
		const id = req.params.id;
		const query = { serviceId: id };
		req.headers.descending === 'true' ? time = -1 : time = 1;
		// console.log(time);
		const cursor = reviewCollection.find(query).sort({ time: time });
		const reviews = await cursor.toArray();
		res.send(reviews);
	});

	// user gets jwt after a successful login
	app.post('/jwt', (req, res) => {
		const user = req.body;
		const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" })
		res.send({ token });
	});

	// sends my reviews
	app.get('/my-reviews/:id', verifyJWT, async (req, res) => {
		const id = req.params.id;
		const decoded = req.decoded;
		if (decoded.uid === id) {
			const query = { uid: id };
			const cursor = reviewCollection.find(query);
			const reviews = await cursor.toArray();
			res.send(reviews);
		} else {
			res.status(403).send({ message: 'Unauthorized Access' });
		}
	});

	// edit reviews
	app.put('/edit-review/:id', verifyJWT, async (req, res) => {
		const decoded = req.decoded;
		const uid = req.headers.userid;
		const comment = req.body.newComment;
		const commentId = req.body.commentId;
		if (decoded.uid === uid) {
			const query = { _id: ObjectId(commentId) };
			const options = { upsert: true };
			const updateComment = {
				$set: {
					comment: comment
				}
			}
			const result = await reviewCollection.updateOne(query, updateComment, options);
			res.send(result);
		} else {
			res.status(403).send({ message: 'Unauthorized Access' });
		}
	});

	app.delete('/edit-review/:id', verifyJWT, async (req, res) => {
		const decoded = req.decoded;
		const uid = req.headers.userid;
		const reviewId = req.params.id;
		if (decoded.uid === uid) {
			const query = { _id: ObjectId(reviewId) };
			const result = await reviewCollection.deleteOne(query);
			res.send(result);
		} else {
			res.status(403).send({ message: 'Unauthorized Access' });
		}
	});

	// users add review
	app.post('/add-review', verifyJWT, async (req, res) => {
		const decoded = req.decoded;
		const uid = req.headers.uid;
		const review = { ...req.body }
		const date = new Date();
		review.time = date.getTime();
		if (decoded.uid === uid) {
			const result = await reviewCollection.insertOne(review);
			res.send(result);
		} else {
			res.status(403).send({ message: 'Unauthorized Access' });
		}
	});

	// users add service
	app.post('/add-service', verifyJWT, async (req, res) => {
		const decoded = req.decoded;
		const uid = req.headers.uid;
		const service = req.body
		if (decoded.uid === uid) {
			const result = await serviceCollection.insertOne(service);
			res.send(result);
		} else {
			res.status(403).send({ message: 'Unauthorized Access' });
		}
	})
}

crudOperation();

app.listen(port, () => console.log('Listening on port', port));