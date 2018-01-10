function getDiceEmbed(user, min = 1, max = 100) {
    let roll = Math.floor(Math.random() * (max - min + 1)) + min
    return {title: `Dice [${min}-${max}]: ${user} has rolled ${roll}.`}
}

module.exports = getDiceEmbed
