const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Test of Jammer online is'),
  async execute(interaction) {
    await interaction.reply('🎵 Pong! Jammer is online.');
  },
};