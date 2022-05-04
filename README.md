# Phoenix.js
An easy to understand, disturbingly similar to discord.js API wrapper designed to work with [phoenix.amelix.xyz](https://phoenix.amelix.xyz), a chatting app I developed the API for.

## Links
- [Website](https://phoenix.amelix.xyz)
- [Phoenix Discord server](https://discord.gg/Px5bA8gfme)
- [Phoenix Phoenix server](https://phoenix.amelix.xyz/invite/apocalypse)
- [npm](https://www.npmjs.com/package/@amelix/phoenix.js)

# Installation
```
npm i @amelix/phoenix.js
```

# Usage
Currently there's no user friendly method of making a bot on Phoenix, however, if by some chance you happen to have a bot (likely by being my friend), you can make a bot like this:
```js
const Phoenix = require('@amelix/phoenix.js');

// Login using your token
const bot = new Phoenix.Client("YOUR_TOKEN_HERE");

// Create event handlers
bot.on('ready', () => {
  console.log("Logged in as " + bot.user.username);
})

bot.on('message', message => {
  // Create a simple command
  if (message.content === "!ping") {
    message.channel.send("Pong!")
  }
})
```
There's no actual documentation for all of the features yet, ask me on the [Discord server](https://discord.gg/Px5bA8gfme) if any assistance is required.

## Selfbots
Currently, I fully support the making of selfbots using this package. However, any large scale abuse and/or spamming will result in action taken against the amelix.xyz account.
Selfbots *may*  not work at this current stage. I don't partiuclarly prioritise making selfbots work with this library as that was never its primary function.

## Can I contribute?
If you think anything could be improved, submit a pull request and I'll have a look. I will say however that I probably use this package more than anyone else does and my decisions for how things are generally done in this package are final at the moment.

If you do change something, make a file called "env.json" in the root folder with the contents:
```json
{
  "token": "your bot token"
}
```
Then run `npm run test`.
This will build the repository and run `tests.js`. I put in a few things to ensure a bot can login and fetch other users - feel free to edit it how you like to ensure your change actually allows a bot to work.