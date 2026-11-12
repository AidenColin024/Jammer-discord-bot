const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { leave, getServer } = require('../music/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop de muziek en laat de bot het kanaal verlaten'),

  async execute(interaction) {
    if (!getServer(interaction.guildId)) {
      return interaction.reply({
        content: 'Ik speel nu niets af.',
        flags: MessageFlags.Ephemeral,
      });
    }

    leave(interaction.guildId);

    await interaction.reply('Gestopt en kanaal verlaten.');
  },
};