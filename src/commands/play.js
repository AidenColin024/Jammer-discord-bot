const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { resolveTrack } = require('../music/ytdlp');
const { connect, addTrack } = require('../music/player');

function formatDuration(seconds) {
  if (!seconds) return 'Live';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Speel een nummer af of zet het in de wachtrij')
    .addStringOption((option) =>
      option
        .setName('nummer')
        .setDescription('Zoekterm of YouTube-link')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('nummer');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: '🔇 Ga eerst in een spraakkanaal zitten.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (/open\.spotify\.com|^spotify:/.test(query)) {
      return interaction.reply({
        content: '🟢 Spotify-links worden nog gebouwd. Gebruik voorlopig een zoekterm of YouTube-link.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();

    let track;
    try {
      track = await resolveTrack(query);
    } catch (error) {
      console.error('Zoekfout:', error.message);
      return interaction.editReply('❌ Er ging iets mis bij het zoeken.');
    }

    if (!track) {
      return interaction.editReply(`❌ Niets gevonden voor **${query}**.`);
    }

    let position;
    try {
      const gp = await connect(voiceChannel);
      position = addTrack(gp, track);
    } catch (error) {
      console.error('Verbindingsfout:', error.message);
      return interaction.editReply('❌ Ik kon niet verbinden met het spraakkanaal.');
    }

    const embed = new EmbedBuilder()
      .setColor(0x1db954)
      .setTitle(track.title)
      .setURL(track.url)
      .setThumbnail(track.thumbnail)
      .setFooter({ text: `Aangevraagd door ${interaction.user.username}` });

    if (position === 0) {
      embed
        .setAuthor({ name: '🎵 Speelt nu' })
        .setDescription(`${track.artist} • ${formatDuration(track.duration)}`);
    } else {
      embed
        .setAuthor({ name: '➕ Toegevoegd aan de wachtrij' })
        .setDescription(`${track.artist} • ${formatDuration(track.duration)}\nPositie in wachtrij: **${position}**`);
    }

    await interaction.editReply({ embeds: [embed] });
  },
};