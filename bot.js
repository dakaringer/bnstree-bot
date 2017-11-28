require('dotenv').config({silent: true})
const Discord = require('discord.js')
const getCharacterEmbed = require('./functions/character')
const getMarketEmbed = require('./functions/market')

const client = new Discord.Client()
const token = process.env.DISCORD_TOKEN

//https://discordapp.com/oauth2/authorize?client_id=275878450227576832&scope=bot

client.on('ready', () => {
    console.log('I am ready!')
})

const helpMsg = `\`\`\`
Official BnSTree Discord Bot

Commands:
  !character [region] [name]        Search character profile

  !market [region] [item]           Search marketplace
  Options:
    -e, -exact                      Search exact item name
\`\`\``

client.on('message', async message => {
    let characterRe = /bnstree\.com\/character\/(eu|na|kr)\/(\S+)/gi
    let characterMatch = characterRe.exec(message.content)

    if (process.env.NODE_ENV === 'production' || message.channel.id === process.env.TEST_CHANNEL) {
        if (characterMatch) {
            let region = characterMatch[1]
            let name = decodeURIComponent(characterMatch[2])

            let emojis = {
                attack: client.emojis.get('385043651966795778'),
                defense: client.emojis.get('385043652445077504'),
                equipment: client.emojis.get('385044342626058241')
            }

            let embed = await getCharacterEmbed(region, name, emojis, true)
            message.channel.send('', {embed: embed})
        } else if (message.content.startsWith('!')) {
            let flagRe = /(-\w+)/g
            let flags = message.content.match(flagRe)
            let args = message.content
                .replace(flagRe, '')
                .substring(1)
                .split(' ')
            let cmd = args[0]
            args = args.splice(1)

            switch (cmd) {
                case 'character': {
                    let region = args[0]
                    let name = args.splice(1).join(' ')

                    let emojis = {
                        attack: client.emojis.get('385043651966795778'),
                        defense: client.emojis.get('385043652445077504'),
                        equipment: client.emojis.get('385044342626058241')
                    }

                    if (region) {
                        let embed = await getCharacterEmbed(region, name, emojis)
                        message.channel.send('', {embed: embed})
                    } else {
                        message.channel.send('', {embed: {title: 'Enter region'}})
                    }
                    break
                }
                case 'market': {
                    let region = args[0]
                    let query = args.splice(1).join(' ')
                    let exact = false
                    if (flags) {
                        exact = flags.indexOf('-e') !== -1 || flags.indexOf('-exact') !== -1
                    }

                    let emojis = {
                        gold: client.emojis.get('382852281764282369'),
                        silver: client.emojis.get('382852281907019777'),
                        copper: client.emojis.get('382852282028523520'),
                        up: client.emojis.get('382860105109995524'),
                        down: client.emojis.get('382860104925708309')
                    }

                    if (region) {
                        let embed = await getMarketEmbed(region, query, exact, emojis)
                        message.channel.send('', {embed: embed})
                    } else {
                        message.channel.send('', {embed: {title: 'Enter region'}})
                    }
                    break
                }
                case 'help': {
                    message.channel.send(helpMsg)
                }
            }
        } else if (message.content === 'ping') {
            message.channel.send('pong')
        }
    }
})

client.login(token)
