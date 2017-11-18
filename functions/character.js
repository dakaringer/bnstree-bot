const gql = require('graphql-tag')
const gqlClient = require('../apollo')

const characterQuery = gql`
    query($name: String!, $region: String!) {
        Character(name: $name, region: $region) {
            general {
                account
                region
                name
                className
                classCode
                level
                server
            }
            statData: stats
            equipData: equipment
            characterVotes: votes
        }
    }
`

const classElements = {
    BM: ['attack_attribute_fire_value', 'attack_attribute_lightning_value'],
    KF: ['attack_attribute_fire_value', 'attack_attribute_wind_value'],
    DE: ['attack_attribute_earth_value', 'attack_attribute_void_value'],
    FM: ['attack_attribute_fire_value', 'attack_attribute_ice_value'],
    AS: ['attack_attribute_lightning_value', 'attack_attribute_void_value'],
    SU: ['attack_attribute_wind_value', 'attack_attribute_earth_value'],
    BD: ['attack_attribute_wind_value', 'attack_attribute_lightning_value'],
    WL: ['attack_attribute_ice_value', 'attack_attribute_void_value'],
    SF: ['attack_attribute_ice_value', 'attack_attribute_earth_value'],
    SH: ['attack_attribute_fire_value', 'attack_attribute_void_value']
}

const elements = {
    attack_attribute_fire_value: 'Flame Damage',
    attack_attribute_ice_value: 'Frost Damage',
    attack_attribute_wind_value: 'Wind Damage',
    attack_attribute_earth_value: 'Earth Damage',
    attack_attribute_lightning_value: 'Lightning Damage',
    attack_attribute_void_value: 'Shadow Damage'
}

const accessories = {
    ring: 'Ring',
    earring: 'Earring',
    necklace: 'Necklace',
    bracelet: 'Bracelet',
    belt: 'Belt',
    gloves: 'Gloves',
    soul: 'Soul',
    'soul-2': 'Spirit',
    guard: 'Pet',
    singongpae: 'Soul Badge',
    rune: 'Mystic Badge'
}

function countSS(pieces) {
    let result = {}
    pieces.forEach(piece => {
        result[piece] = result[piece] ? result[piece] + 1 : 1
    })
    return result
}

async function getCharacterEmbed(region, name, lite = false) {
    return new Promise((resolve, reject) => {
        gqlClient
            .query({
                query: characterQuery,
                variables: {
                    name: name,
                    region: region.toLowerCase()
                }
            })
            .then(json => {
                let character = json.data.Character.general
                let stats = json.data.Character.statData
                let equip = json.data.Character.equipData

                let fields = []
                if (!lite) {
                    let attackField = {
                        name: `:crossed_swords: Attack :small_orange_diamond: ${stats.point_ability
                            .offense_point}P`,
                        value:
                            `**Attack Power** ${stats.total_ability.attack_power_value}\t\n` +
                            `**Accuracy** ${stats.total_ability.attack_hit_value} (${stats
                                .total_ability.attack_hit_rate}%)\t\n` +
                            `**Critical** ${stats.total_ability.attack_critical_value} (${stats
                                .total_ability.attack_critical_rate}%)\t\n` +
                            `**Critical Damage** ${stats.total_ability
                                .attack_critical_damage_value} (${stats.total_ability
                                .attack_critical_damage_rate}%)\t\n`,
                        inline: true
                    }

                    classElements[character.classCode].forEach(e => {
                        let value = stats.total_ability[e]
                        let rate = stats.total_ability[e.substr(0, e.length - 5) + 'rate']
                        attackField.value += `**${elements[e]}** ${value} (${rate}%)\t\n`
                    })

                    let defenseField = {
                        name: `:shield: Defense :small_orange_diamond: ${stats.point_ability
                            .defense_point}P`,
                        value:
                            `**HP** ${stats.total_ability.max_hp}\n` +
                            `**Defense** ${stats.total_ability.defend_power_value} (${stats
                                .total_ability.defend_physical_damage_reduce_rate}%)\n` +
                            `**Evasion** ${stats.total_ability.defend_dodge_value} (${stats
                                .total_ability.defend_dodge_rate}%)\n` +
                            `**Block** ${stats.total_ability.defend_parry_value} (${stats
                                .total_ability.defend_parry_rate}%)\n` +
                            `**Critical Defense** ${stats.total_ability
                                .defend_critical_value} (${stats.total_ability
                                .defend_critical_rate}%)`,
                        inline: true
                    }

                    let equipField = {
                        name: ':dagger: Equipment',
                        value: `**Weapon** ${equip.weapon.name}\n`
                    }

                    equip.accessories.forEach(acc => {
                        let type = acc.type
                        if (acc.grade !== 'empty' && accessories[type]) {
                            equipField.value += `**${accessories[type]}** ${acc.name}\n`
                        }
                    })

                    let ssCount = countSS(equip.soulshield.pieceNames)
                    let soulshieldField = {
                        name: 'Soul Shield',
                        value: ''
                    }
                    for (let set in ssCount) {
                        soulshieldField.value += `[${ssCount[set]}] ${set}\n`
                    }

                    fields = [attackField, defenseField, equipField, soulshieldField]
                }

                let desc = `:two_hearts:  ${json.data.Character.characterVotes}\n`
                desc += `Level ${character.level[0]}${character.level[1]
                    ? ` • HM Level ${character.level[1]}`
                    : ''}\n`
                desc += `${character.className}\n`
                desc += `${character.server}`

                let embed = {
                    title: `${character.name} [${character.account}]`,
                    color: 0x00bfff,
                    url: encodeURI(
                        `https://bnstree.com/character/${character.region}/${character.name}`
                    ),
                    thumbnail: {
                        url: `https://static.bnstree.com/images/class/${character.classCode}.png`
                    },
                    description: desc,
                    fields: fields,
                    footer: {
                        text: 'BnSTree',
                        icon_url: 'https://bnstree.com/android-chrome-192x192.png'
                    }
                }
                resolve(embed)
            })
            .catch(e => {
                console.error(e)
                resolve({title: 'Character not found'})
            })
    })
}

module.exports = getCharacterEmbed
