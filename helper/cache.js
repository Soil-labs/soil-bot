const NodeCache = require("node-cache")
const myCache = new NodeCache({ stdTTL: 20, checkperiod: 30, deleteOnExpire: false });

module.exports = myCache;