const formatPath = (path) => {
    const filePath = path.replace(/\\/g, '/');
    return filePath;
};
module.exports = formatPath;
