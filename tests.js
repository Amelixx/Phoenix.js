const env = require('./env.json')
const Phoenix = require('./lib/index')
const bot = new Phoenix.Client(env.token)

bot.on('ready', () => {
    console.log("logged in as " + bot.user.username)

    assertEqual(bot.user.bot, true)
    assertEqual(typeof bot.users.get("19656660982"), "object")
})

bot.on('message', message => {
    console.log(message.content)
    // uncomment if you wanna test the bot responding to your messages
    // if (!message.author.bot) message.channel.send(message.content)
})

function assertEqual(arg1, arg2) {
    if (arg1 !== arg2) {
        throw new Error(`Assert failure:\n\tExpected: ${arg2}\n\tReceived: ${arg1}\n`)
    }
}