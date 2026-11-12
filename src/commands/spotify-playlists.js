const { SlashCommandBuilder } = require('discord.js');
const { getUserPlaylists } = require('../music/spotifyAuth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spotify-playlists')
    .setDescription('Bekijk je Spotify-playlists'),

  async execute(interaction) {
    await interaction.deferReply({
      ephemeral: true,
    });

    try {
      const playlists = await getUserPlaylists(
        interaction.user.id
      );

      if (!playlists) {
        await interaction.editReply(
          'Koppel eerst je Spotify-account met /spotify-login.'
        );
        return;
      }

      if (playlists.length === 0) {
        await interaction.editReply(
          'Ik kon geen Spotify-playlists vinden.'
        );
        return;
      }

      let message = 'Jouw Spotify-playlists:\n\n';

      for (let i = 0; i < playlists.length; i++) {
        message +=
          (i + 1) +
          '. ' +
          playlists[i].name +
          '\n';
      }

      await interaction.editReply(message);
    } catch (error) {
      console.log(error);

      await interaction.editReply(
        'Er ging iets mis bij het ophalen van je Spotify-playlists.'
      );
    }
  },
};