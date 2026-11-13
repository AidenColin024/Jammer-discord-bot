require('dotenv').config();
const fs = require('fs');
const { REST, Routes } = require('discord.js');

const commands = [];
const files = fs.readdirSync(__dirname + '/commands');

for (const file of files) {
  const command = require('./commands/' + file);
  commands.push(command.data.toJSON());
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

async function deploy() {
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
  console.log(commands.length + ' commando\'s geregistreerd.');
}

deploy();