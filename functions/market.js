const gql = require('graphql-tag')
const gqlClient = require('../apollo')

const itemQuery = gql`
    query($query: String!, $region: String!, $exact: Boolean) {
        Market {
            search(query: $query, region: $region, exact: $exact) {
                item {
                    _id
                    name
                    grade
                    icon
                }
                priceData: price {
                    items
                }
            }
        }
    }
`

function parsePrice(priceData) {
    let dayPrices = priceData[0] ? priceData[0].items : []
    let offset = 1
    let latestFound = false
    let latest = []
    while (!latestFound) {
        latest = dayPrices[dayPrices.length - offset] || []
        if (!latest || latest[1] !== 0 || dayPrices.length - offset === 0) {
            latestFound = true
        }
        offset++
    }

    let monthPrices = priceData[priceData.length - 1].items
    offset = 1
    latestFound = false
    let previous = []
    while (!latestFound) {
        previous = monthPrices[monthPrices.length - offset]
        if (previous[1] !== 0 || monthPrices.length - offset === 0) {
            latestFound = true
        }
        offset++
    }

    let delta = latest[1] - previous[1]

    let diffPrice = parseCurrency(delta)
    let itemPrice = parseCurrency(latest[1])

    let percentDiff = delta / (latest[1] === 0 ? delta : latest[1]) * 100
    percentDiff = isNaN(percentDiff) ? 0 : percentDiff

    return [itemPrice, diffPrice, delta, percentDiff]
}

function parseCurrency(price) {
    price = Math.abs(price)
    let copper = price % 100
    let silver = Math.floor(price / 100) % 100
    let gold = Math.floor(price / 10000)
    return [gold, silver, copper]
}

async function getMarketEmbed(region, query, exact = false) {
    return new Promise((resolve, reject) => {
        gqlClient
            .query({
                query: itemQuery,
                variables: {
                    query: query,
                    region: region,
                    exact: exact
                }
            })
            .then(json => {
                let item = json.data.Market.search.item
                let priceData = json.data.Market.search.priceData

                let price = parsePrice(priceData)
                let regionName = region === 'na' ? 'North America' : 'Europe'

                let fields = []
                if (!isNaN(price[0][0])) {
                    fields = [
                        {
                            name: 'Price',
                            value: `${price[0][0]} Gold • ${price[0][1]} Silver • ${price[0][2]} Copper`
                        },
                        {
                            name: 'Change',
                            value: `${price[2] >= 0
                                ? '▲'
                                : '▼'} ${price[1][0]} Gold • ${price[1][1]} Silver • ${price[1][2]} Copper (${price[3].toFixed(
                                2
                            )}%)`
                        }
                    ]
                } else {
                    fields = [
                        {
                            name: 'Price',
                            value: 'No Data'
                        }
                    ]
                }

                let embed = {
                    author: {
                        name: regionName
                    },
                    title: item.name,
                    color: 0x00bfff,
                    url: encodeURI(`https://bnstree.com/market/${region}/${item._id}`),
                    thumbnail: {
                        url: item.icon
                    },
                    fields: fields,
                    footer: {
                        text: 'BnSTree',
                        icon_url: 'https://bnstree.com/android-chrome-192x192.png'
                    }
                }
                resolve(embed)
            })
            .catch(e => {
                resolve({title: 'Item not found'})
            })
    })
}

module.exports = getMarketEmbed
