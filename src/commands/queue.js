const { SlashCommandBuilder } = require('discord.js');
const { getServer } = require('../music/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Bekijk de wachtrij'),

  async execute(interaction) {
    const server = getServer(interaction.guildId);

    if (!server || !server.current) {
      await interaction.reply('Er speelt nu niets.');
      return;
    }

    let message = '🎵 Speelt nu: ' + server.current.title + ' - ' + server.current.artist + '\n\n';
    message += ' Hierna:\n';

    if (server.queue.length === 0) {
      message += 'De wachtrij is leeg.';
    }

    for (let i = 0; i < server.queue.length && i < 10; i++) {
      const track = server.queue[i];
      message += (i + 1) + '. ' + track.title + ' - ' + track.artist + '\n';
    }

    if (server.queue.length > 10) {
      message += '... en nog ' + (server.queue.length - 10) + ' nummers';
    }

    await interaction.reply(message);
  },
};