require('dotenv').config();

const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const { startSpotifyAuthServer } = require('./music/spotifyAuth');

// Maak de Discord-bot aan
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Laad alle commands
const commands = {};

const files = fs.readdirSync('./src/commands');

for (const file of files) {
  const command = require('./commands/' + file);
  commands[command.data.name] = command;
}

// Wanneer de bot online komt
client.once('clientReady', () => {
  console.log('Bot is online!');
});

// Wanneer iemand een command gebruikt
client.on('interactionCreate', async (interaction) => {

  if (!interaction.isChatInputCommand()) return;

  const command = commands[interaction.commandName];

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.log(error);
  }

});

// Start Spotify en Discord
startSpotifyAuthServer();

client.login(process.env.DISCORD_TOKEN);