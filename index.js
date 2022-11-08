const express = require('express');
const { MongoClient } = require('mongodb');
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

}

crudOperation();

app.listen(port, () => console.log('Listening on port', port));
