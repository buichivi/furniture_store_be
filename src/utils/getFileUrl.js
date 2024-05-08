const getFileUrl = (req, filename) => {
    const rootUrl = `${req.protocol}://${req.get('host')}`;
    const filePath = filename.slice(6).replace(/\\/g, '/');
    return rootUrl + filePath;
};

module.exports = getFileUrl;
