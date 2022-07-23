const NodeCache = require("node-cache")
const myCache = new NodeCache({ stdTTL: 10, checkperiod: 20, deleteOnExpire: false });

module.exports = myCache;