require('dotenv').config({silent: true})
const Discord = require('discord.js')
const getCharacterEmbed = require('./functions/character')

const client = new Discord.Client()
const token = process.env.DISCORD_TOKEN

//https://discordapp.com/oauth2/authorize?client_id=275878450227576832&scope=bot

client.on('ready', () => {
    console.log('I am ready!')
})

client.on('message', async message => {
    let characterRe = /bnstree\.com\/character\/(eu|na|kr)\/(\S+)/gi
    let characterMatch = characterRe.exec(message.content)

    if (process.env.NODE_ENV === 'production' || message.channel.id === process.env.TEST_CHANNEL) {
        if (characterMatch) {
            let region = characterMatch[1]
            let name = decodeURIComponent(characterMatch[2])

            let embed = await getCharacterEmbed(region, name)
            message.channel.send('', {embed: embed})
        } else if (message.content === 'ping') {
            message.channel.send('pong')
        }
    }
})

client.login(token)
