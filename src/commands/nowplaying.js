const { SlashCommandBuilder } = require('discord.js');
const { getServer } = require('../music/player');

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  let rest = Math.floor(seconds % 60);
  if (rest < 10) {
    rest = '0' + rest;
  }
  return minutes + ':' + rest;
}

function formatDate(date) {
  if (!date) {
    return 'Onbekend';
  }
  return date.slice(6, 8) + '-' + date.slice(4, 6) + '-' + date.slice(0, 4);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Laat zien welk nummer er nu speelt'),

  async execute(interaction) {
    const server = getServer(interaction.guildId);

    if (!server || !server.current) {
      await interaction.reply('Er speelt nu niets.');
      return;
    }

    const track = server.current;
    const played = server.player.state.resource.playbackDuration / 1000;

    let message = track.title + '**\n';
    message += 'Artiest: ' + track.artist + '\n';
    message += 'Album: ' + track.album + '\n';
    message += 'Uitgebracht: ' + formatDate(track.releaseDate) + '\n';
    message += 'Tijd: ' + formatTime(played) + ' / ' + formatTime(track.duration);

    await interaction.reply(message);
  },
};