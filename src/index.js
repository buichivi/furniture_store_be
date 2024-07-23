const express = require('express');
const fs = require('fs');
const https = require('https');
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

// cors configs
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
var corsOptionsDelegate = function (req, callback) {
    var corsOptions;
    if (allowedOrigins.indexOf(req.header('Origin')) !== -1) {
        console.log(req.header('Origin'));
        corsOptions = { origin: true, credentials: true }; // reflect (enable) the requested origin in the CORS response
    } else {
        corsOptions = { origin: false }; // disable CORS for this request
    }
    console.log(corsOptions);
    callback(null, corsOptions); // callback expects two parameters: error and options
};
app.use(cors(corsOptionsDelegate), express.static('public'));
// Routes init
app.use('/api', cors(corsOptionsDelegate), apiRouter);

app.listen(PORT, () => {
    console.log(`Server is running on PORT:${PORT}`);
});

// https
//     .createServer(
//         {
//             key: fs.readFileSync('src/furniture-store.backend.com+2-key.pem'),
//             cert: fs.readFileSync('src/furniture-store.backend.com+2.pem'),
//         },
//         app
//     )
//     .listen(PORT, () => {
//         console.log(`Server is running on PORT:${PORT}`);
//     });
