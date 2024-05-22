const express = require('express');
const port = 3000;
const app = express();
const apiRouter = require('./routes');
const db = require('./config/db');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Connect mongoDB
db.connect();

const allowedOrigins = ['http://localhost:5173', 'http://localhost:4000'];
app.use(cookieParser());
app.use(
    cors({
        origin: (origin, callback) => {
            if (allowedOrigins.includes(origin) || !origin) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Routes init
app.use('/api', apiRouter);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
