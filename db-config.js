const async = require('async')
const mongodb = require('mongodb').MongoClient
const mongoUrl = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}`
const redis = require('redis')
const logger = require('./logger')

let db
let cache = redis.createClient({
    password: process.env.REDIS_PASS
})

module.exports = {
    getDb: () => db,
    connect: cb => {
        mongodb.connect(mongoUrl, function (err, client) {
            if (err) {
                throw err
            }
            logger.info('Connected to db.')
            db = client.db('bnstree')
            return cb(db)
        })
    },
    connectionUrl: mongoUrl,
    deleteCache: pattern => {
        return new Promise((resolve, reject) => {
            cache.keys(pattern, (err, rows) => {
                if (err) return

                async.each(
                    rows,
                    (row, deleteCallback) => {
                        cache.del(row, deleteCallback)
                    },
                    (err, result) => {
                        if (err) return reject(err)
                        resolve(result)
                    }
                )
            })
        })
    }
}
