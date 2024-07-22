const getFileUrl = (req, filename) => {
    if (filename == undefined) throw new Error('File name is not valid');
    const rootUrl = `${req.protocol}://${req.get('host')}`;
    const filePath = filename?.slice(6)?.replace(/\\/g, '/');
    return rootUrl + filePath;
};

module.exports = getFileUrl;
