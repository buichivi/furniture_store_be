const express = require('express');
const port = 3000;
const app = express();
const apiRouter = require('./routes');
const db = require('./config/db');
const cors = require('cors');
require('dotenv').config();

// Connect mongoDB
db.connect();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Routes init
app.use('/api', apiRouter);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
