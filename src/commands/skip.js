const { SlashCommandBuilder } = require('discord.js');
const { getServer } = require('../music/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Sla het huidige nummer over'),

  async execute(interaction) {
    const server = getServer(interaction.guildId);

    if (!server || !server.current) {
      await interaction.reply('Er speelt nu niets.');
      return;
    }

    const title = server.current.title;
    server.player.stop();
    await interaction.reply('Overgeslagen: ' + title);
  },
};