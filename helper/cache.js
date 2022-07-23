const NodeCache = require("node-cache")
const myCache = new NodeCache({ stdTTL: 5, checkperiod: 10, deleteOnExpire: false });

module.exports = myCache;