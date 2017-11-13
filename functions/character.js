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

async function getCharacterEmbed(region, name) {
    return new Promise((resolve, reject) => {
        gqlClient
            .query({
                query: characterQuery,
                variables: {
                    name: name,
                    region: region
                }
            })
            .then(json => {
                let character = json.data.Character.general
                let stats = json.data.Character.statData
                let equip = json.data.Character.equipData

                let attackField = {
                    name: `:crossed_swords: Attack :small_orange_diamond: ${stats.point_ability
                        .offense_point}P`,
                    value:
                        `**Attack Power** - ${stats.total_ability.attack_power_value}\n` +
                        `**Accuracy** - ${stats.total_ability.attack_hit_value} (${stats
                            .total_ability.attack_hit_rate}%)\n` +
                        `**Critical** - ${stats.total_ability.attack_critical_value} (${stats
                            .total_ability.attack_critical_rate}%)\n` +
                        `**Critical Damage** - ${stats.total_ability
                            .attack_critical_damage_value} (${stats.total_ability
                            .attack_critical_damage_rate}%)\n`,
                    inline: true
                }

                classElements[character.classCode].forEach(e => {
                    let value = stats.total_ability[e]
                    let rate = stats.total_ability[e.substr(0, e.length - 5) + 'rate']
                    attackField.value += `**${elements[e]}** - ${value} (${rate}%)\t\n`
                })

                let defenseField = {
                    name: `:shield: Defense :small_orange_diamond: ${stats.point_ability
                        .defense_point}P`,
                    value:
                        `**HP** - ${stats.total_ability.max_hp}\n` +
                        `**Defense** - ${stats.total_ability.defend_power_value} (${stats
                            .total_ability.defend_physical_damage_reduce_rate}%)\n` +
                        `**Evasion** - ${stats.total_ability.defend_dodge_value} (${stats
                            .total_ability.defend_dodge_rate}%)\n` +
                        `**Block** - ${stats.total_ability.defend_parry_value} (${stats
                            .total_ability.defend_parry_rate}%)\n` +
                        `**Critical Defense** - ${stats.total_ability
                            .defend_critical_value} (${stats.total_ability.defend_critical_rate}%)`,
                    inline: true
                }

                let equipField = {
                    name: ':dagger: Equipment',
                    value: `**Weapon** - ${equip.weapon.name}\n`
                }

                equip.accessories.forEach(acc => {
                    let type = acc.type
                    if (acc.grade !== 'empty' && accessories[type]) {
                        equipField.value += `**${accessories[type]}** - ${acc.name}\n`
                    }
                })

                let embed = {
                    title: `${character.name} [${character.account}]`,
                    color: 0x00bfff,
                    url: encodeURI(
                        `https://bnstree.com/character/${character.region}/${character.name}`
                    ),
                    thumbnail: {
                        url: `https://static.bnstree.com/images/class/${character.classCode}.png`
                    },
                    description: `Level ${character.level[0]}${character.level[1]
                        ? ` • HM Level ${character.level[1]}`
                        : ''}\n${character.className}\n${character.server}`,
                    fields: [attackField, defenseField, equipField],
                    footer: {
                        text: 'BnSTree',
                        icon_url: 'https://bnstree.com/android-chrome-192x192.png'
                    }
                }
                resolve(embed)
            })
            .catch(e => {
                console.error(e)
                reject(e)
            })
    })
}

module.exports = getCharacterEmbed