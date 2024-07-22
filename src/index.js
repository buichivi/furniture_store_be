const express = require('express');
const app = express();
const apiRouter = require('./routes');
const db = require('./config/db');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Connect mongoDB
db.connect();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const setCorsHeaders = (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD');
    next();
};

app.use(setCorsHeaders, express.static('public'));

// cors configs
const allowedOrigins = process.env.ALLOWED_ORIGINS.split('.');
var corsOptionsDelegate = function (req, callback) {
    var corsOptions;
    if (allowedOrigins.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true, credentials: true }; // reflect (enable) the requested origin in the CORS response
    } else {
        corsOptions = { origin: false }; // disable CORS for this request
    }
    callback(null, corsOptions); // callback expects two parameters: error and options
};
app.use(cors(corsOptionsDelegate));

// Routes init
app.use('/api', apiRouter);

app.listen(PORT, () => {
    console.log(`Server is running on PORT:${PORT}`);
});
