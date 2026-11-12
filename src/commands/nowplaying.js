const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { getGuildPlayer } = require('../music/player');

// 83 seconden → "1:23"
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// "19870727" → "27 juli 1987"
function formatDate(date) {
  if (!date) return 'Onbekend';
  const year = date.slice(0, 4);
  const month = date.slice(4, 6);
  const day = date.slice(6, 8);
  return new Date(year, month - 1, day).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Voortgangsbalk: ▬▬▬🔘▬▬▬▬▬
function progressBar(current, total) {
  const size = 15;
  const position = Math.min(size - 1, Math.floor((current / total) * size));
  return '▬'.repeat(position) + '🔘' + '▬'.repeat(size - position - 1);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Laat zien welk nummer er nu speelt'),

  async execute(interaction) {
    const gp = getGuildPlayer(interaction.guildId);

    if (!gp || !gp.current) {
      return interaction.reply({
        content: '🔇 Er speelt nu niets.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const track = gp.current;

    // Hoe lang het nummer al speelt (in seconden)
    const resource = gp.player.state.resource;
    const played = resource ? resource.playbackDuration / 1000 : 0;

    const progress = track.duration
      ? `${progressBar(played, track.duration)}  ${formatTime(played)} / ${formatTime(track.duration)}`
      : '🔴 Live';

    const embed = new EmbedBuilder()
      .setColor(0x1db954)
      .setAuthor({ name: '🎵 Nu aan het spelen' })
      .setTitle(track.title)
      .setURL(track.url)
      .setThumbnail(track.thumbnail)
      .addFields(
        { name: 'Artiest', value: track.artist, inline: true },
        { name: 'Album', value: track.album || 'Onbekend', inline: true },
        { name: 'Uitgebracht', value: formatDate(track.releaseDate), inline: true },
      )
      .setDescription(progress);

    await interaction.reply({ embeds: [embed] });
  },
};