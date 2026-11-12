const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getGuildPlayer } = require('../music/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Sla het huidige nummer over'),

  async execute(interaction) {
    const gp = getGuildPlayer(interaction.guildId);

    if (!gp || !gp.current) {
      return interaction.reply({ content: '🔇 Er speelt nu niets.', flags: MessageFlags.Ephemeral });
    }

    const skipped = gp.current.title;
    gp.player.stop();

    await interaction.reply(`⏭️ **${skipped}** overgeslagen.`);
  },
};