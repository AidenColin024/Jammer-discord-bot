const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { resolveTrack } = require('../music/ytdlp');
const { connect, play } = require('../music/player');

function formatDuration(seconds) {
  if (!seconds) return 'Live';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Speel een nummer af via zoekopdracht of link')
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

    // Zoeken duurt langer dan 3 seconden → Discord laten wachten
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

    try {
      const gp = await connect(voiceChannel);
      play(gp, track);
    } catch (error) {
      console.error('Verbindingsfout:', error.message);
      return interaction.editReply('❌ Ik kon niet verbinden met het spraakkanaal.');
    }

    const embed = new EmbedBuilder()
      .setColor(0x1db954)
      .setAuthor({ name: '🎵 Speelt nu' })
      .setTitle(track.title)
      .setURL(track.url)
      .setDescription(`${track.artist} • ${formatDuration(track.duration)}`)
      .setThumbnail(track.thumbnail)
      .setFooter({ text: `Aangevraagd door ${interaction.user.username}` });

    await interaction.editReply({ embeds: [embed] });
  },
};