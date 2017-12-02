const winston = require('winston')

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.align(),
        winston.format.printf(info => {
            const {timestamp, level, message} = info

            const ts = timestamp.slice(0, 19).replace('T', ' ')
            return `${ts} [${level}]: ${message}`
        })
    ),
    transports: [
        new winston.transports.Console({
            handleExceptions: true
        })
    ],
    exitOnError: false
})

module.exports = logger
