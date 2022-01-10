# Phoenix.js
An easy to understand, disturbingly similar to discord.js API wrapper designed to work with [phoenix.amelix.xyz](https://phoenix.amelix.xyz), a chatting app I developed the API for.

As I develop the API, you can expect this package to be completely up to date and contain all API features pretty much as soon as they get added.

## Links
- [Website](https://phoenix.amelix.xyz)
- [Phoenix Discord server](https://discord.gg/Px5bA8gfme)
- [npm](https://www.npmjs.com/package/@amelix/phoenix.js)

# Installation
```
npm install @amelix/phoenix.js
```

# Usage
Currently there's no user friendly method of making a bot on Phoenix, however, if by some chance you happen to have a bot (likely by being my friend), you can make a bot like this:

It's very similar to discord.js - blame me, I spent 4 years of my life only coding in discord.js.
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
There's no actual documentation for all of the features yet, ask me on the (Discord server)[https://discord.gg/Px5bA8gfme] if any assistance is required.

## Selfbots
Currently, I fully support the making of selfbots using this package. However, any large scale abuse and/or spamming will result in action taken against the amelix.xyz account.

## Can I contribute?
Sure.. If you think anything could be improved, but I will say that I probably use this package more than anyone else does and my decisions for how things are generally done in this package is final.
