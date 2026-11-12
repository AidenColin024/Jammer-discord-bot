const { SlashCommandBuilder } = require('discord.js');
const { getUserToken } = require('../music/spotifyAuth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spotify-liked')
    .setDescription('Bekijk je gelikete Spotify-nummers'),

  async execute(interaction) {
    await interaction.deferReply({
      ephemeral: true,
    });

    try {
      const tokenData = getUserToken(interaction.user.id);

      if (!tokenData) {
        await interaction.editReply(
          'Koppel eerst je Spotify-account met /spotify-login.'
        );
        return;
      }

      const response = await fetch(
        'https://api.spotify.com/v1/me/tracks?limit=10',
        {
          headers: {
            Authorization: 'Bearer ' + tokenData.accessToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geliked nummers ophalen mislukt');
      }

      const data = await response.json();

      if (data.items.length === 0) {
        await interaction.editReply(
          'Ik kon geen gelikete nummers vinden.'
        );
        return;
      }

      let message = 'Jouw gelikete nummers:\n\n';

      for (let i = 0; i < data.items.length; i++) {
        const track = data.items[i].track;

        message +=
          (i + 1) +
          '. ' +
          track.name +
          ' - ' +
          track.artists.map((artist) => artist.name).join(', ') +
          '\n';
      }

      await interaction.editReply(message);
    } catch (error) {
      console.log(error);

      await interaction.editReply(
        'Er ging iets mis bij het ophalen van je gelikete nummers.'
      );
    }
  },
};