const Twitter = require('twitter')
const request = require('request')
const logger = require('../logger')

const { deleteCache, getDb } = require('../db-config')
const db = getDb()
const tweets = db.collection('tweets')
const webhooks = db.collection('webhooks')

const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
})

function isReply(tweet) {
    return (
        tweet.retweeted_status ||
        tweet.in_reply_to_status_id ||
        tweet.in_reply_to_status_id_str ||
        tweet.in_reply_to_user_id ||
        tweet.in_reply_to_user_id_str ||
        tweet.in_reply_to_screen_name
    )
}

client.stream('statuses/filter', { follow: '819625154, 3521186773, 864228034370457600' }, stream => {
    logger.info('Streaming Tweets')
    stream.on('data', tweet => {
        logger.info('Incoming stream...')

        if (!isReply(tweet)) {
            logger.info('Tweet received')

            tweets.insert(tweet)
            deleteCache('graphql_twitter')

            let t = tweet.extended_tweet || tweet
            let text = t.full_text || t.text
            if (t.display_text_range) {
                text = text.substr(0, t.display_text_range[1])
            }

            let embed = {
                title: 'Tweet',
                url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
                author: {
                    name: `@${tweet.user.screen_name}`,
                    url: `https://twitter.com/${tweet.user.screen_name}`
                },
                description: text
            }

            if (t.entities.media && t.entities.media[0].media_url_https) {
                embed.image = {
                    url: t.entities.media[0].media_url_https
                }
            }

            let message = {
                username: `${tweet.user.name}`,
                avatar_url: tweet.user.profile_image_url_https,
                embeds: [embed]
            }

            webhooks.find({}).toArray((err, docs) => {
                if (err) logger.error(err)

                docs.forEach(webhook => {
                    let url = webhook.url

                    request({
                        url: url,
                        method: 'POST',
                        json: message
                    })
                })
            })
        } else {
            logger.info('Tweet is a reply')
        }
    })

    stream.on('error', err => {
        throw err
    })
})
