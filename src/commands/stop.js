const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { destroy, getGuildPlayer } = require('../music/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop de muziek en laat de bot het kanaal verlaten'),

  async execute(interaction) {
    if (!getGuildPlayer(interaction.guildId)) {
      return interaction.reply({ content: 'Ik speel nu niets af.', flags: MessageFlags.Ephemeral });
    }
    destroy(interaction.guildId);
    await interaction.reply('⏹️ Gestopt en kanaal verlaten.');
  },
};