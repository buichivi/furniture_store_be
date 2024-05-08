const fs = require('fs');
const promisify = require('util.promisify');
const unlinkAsync = promisify(fs.unlink);

module.exports = unlinkAsync;
