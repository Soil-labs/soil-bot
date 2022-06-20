const { pino } = require('pino');
const logger = pino({
    level: 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "UTC:yyyy mm dd HH:MM:ss"
        }
    }
});
module.exports = logger;