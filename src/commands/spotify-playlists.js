const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUserPlaylists } = require('../music/spotifyAuth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spotify-playlists')
    .setDescription('Bekijk je Spotify-playlists'),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const playlists = await getUserPlaylists(interaction.user.id);
      if (!playlists) {
        return interaction.editReply('Koppel eerst Spotify met /spotify-login.');
      }
      if (playlists.length === 0) {
        return interaction.editReply('Geen playlists gevonden.');
      }

      let message = 'Jouw Spotify-playlists:\n\n';
      for (let i = 0; i < playlists.length; i++) {
        message += (i + 1) + '. ' + playlists[i].name + '\n';
      }
      return interaction.editReply(message);
    } catch (error) {
      console.error(error);
      return interaction.editReply('Playlists ophalen mislukt.');
    }
  },
};
