const express = require('express');
const port = 3000;
const app = express();
const apiRouter = require('./routes');
const db = require('./config/db');

// Connect mongoDB
db.connect();
app.use(express.json())

// Routes init
app.use('/api', apiRouter);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
