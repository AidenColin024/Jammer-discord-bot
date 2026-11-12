require('dotenv').config();
const fs = require('fs');
const { Client, Events, GatewayIntentBits } = require('discord.js');
const {
  startSpotifyAuthServer,
} = require('./music/spotifyAuth');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const commands = {};
const files = fs.readdirSync(__dirname + '/commands');

for (const file of files) {
  const command = require('./commands/' + file);
  commands[command.data.name] = command;
}

client.once(Events.ClientReady, function () {
  console.log('Ingelogd als ' + client.user.tag);
});

client.on(Events.InteractionCreate, async function (interaction) {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commands[interaction.commandName];
  if (!command) {
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.log(error);
  }
});

startSpotifyAuthServer();
client.login(process.env.DISCORD_TOKEN);