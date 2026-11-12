const { SlashCommandBuilder } = require('discord.js');
const { getServer, leave } = require('../music/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop de muziek en verlaat het kanaal'),

  async execute(interaction) {
    if (!getServer(interaction.guildId)) {
      await interaction.reply('Ik speel nu niets af.');
      return;
    }

    leave(interaction.guildId);
    await interaction.reply('Gestopt.');
  },
};