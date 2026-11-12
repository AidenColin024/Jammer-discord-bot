const {
  SlashCommandBuilder,
  MessageFlags,
} = require('discord.js');

const {
  resolvePlaylist,
} = require('../music/ytdlp');

const {
  joinChannel,
  addTracks,
} = require('../music/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Voeg een YouTube-playlist toe aan de wachtrij')
    .addStringOption((option) =>
      option
        .setName('link')
        .setDescription('Link naar een YouTube-playlist')
        .setRequired(true)
    ),

  async execute(interaction) {
    const link = interaction.options.getString('link');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: 'Ga eerst in een spraakkanaal zitten.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (link.includes('spotify.com')) {
      return interaction.reply({
        content: 'Spotify-playlists worden nog niet ondersteund.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();

    try {
      const tracks = await resolvePlaylist(link);

      if (!tracks.length) {
        return interaction.editReply(
          'Ik kon geen nummers in deze playlist vinden.'
        );
      }

      const server = joinChannel(voiceChannel);

      addTracks(server, tracks);

      await interaction.editReply(
        `Playlist toegevoegd. ${tracks.length} nummers zijn aan de wachtrij toegevoegd.`
      );
    } catch (error) {
      console.error('Playlist fout:', error);

      await interaction.editReply(
        'De playlist kon niet worden geladen.'
      );
    }
  },
};