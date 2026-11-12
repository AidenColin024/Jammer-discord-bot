const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require('discord.js');

const { searchTrack } = require('../music/ytdlp');
const { joinChannel, addTrack } = require('../music/player');

function formatDuration(seconds) {
  if (!seconds) {
    return 'Live';
  }

  const minutes = Math.floor(seconds / 60);
  const secondsLeft = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${secondsLeft}`;
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
        content: 'Ga eerst in een spraakkanaal zitten.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (/open\.spotify\.com|^spotify:/.test(query)) {
      return interaction.reply({
        content:
          'Spotify-links worden nog gebouwd. Gebruik voorlopig een zoekterm of YouTube-link.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();

    try {
      const track = await searchTrack(query);

      if (!track) {
        return interaction.editReply(
          'Ik kon geen nummer vinden.'
        );
      }

      const server = joinChannel(voiceChannel);

      const position = addTrack(server, track);

      const embed = new EmbedBuilder()
        .setColor(0x1db954)
        .setTitle(track.title)
        .setURL(track.url)
        .addFields(
          {
            name: 'Artiest',
            value: track.artist || 'Onbekend',
            inline: true,
          },
          {
            name: 'Duur',
            value: formatDuration(track.duration),
            inline: true,
          }
        );

      if (position === 0) {
        embed.setAuthor({
          name: 'Nu aan het spelen',
        });
      } else {
        embed.setAuthor({
          name: `Toegevoegd aan wachtrij - positie ${position}`,
        });
      }

      await interaction.editReply({
        embeds: [embed],
      });
    } catch (error) {
      console.error('Play fout:', error);

      await interaction.editReply(
        'Het nummer kon niet worden afgespeeld.'
      );
    }
  },
};