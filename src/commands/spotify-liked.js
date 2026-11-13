const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getUserToken } = require('../music/spotifyAuth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spotify-liked')
    .setDescription('Bekijk je gelikete Spotify-nummers'),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const token = await getUserToken(interaction.user.id);
      if (!token) {
        return interaction.editReply('Koppel eerst Spotify met /spotify-login.');
      }

      const response = await fetch('https://api.spotify.com/v1/me/tracks?limit=10', {
        headers: { Authorization: 'Bearer ' + token.accessToken },
      });
      if (!response.ok) throw new Error('Nummers ophalen mislukt');

      const data = await response.json();
      if (data.items.length === 0) {
        return interaction.editReply('Geen gelikete nummers gevonden.');
      }

      let message = 'Jouw gelikete nummers:\n\n';
      for (let i = 0; i < data.items.length; i++) {
        const track = data.items[i].track;
        const artists = track.artists.map(artist => artist.name).join(', ');
        message += (i + 1) + '. ' + track.name + ' - ' + artists + '\n';
      }
      return interaction.editReply(message);
    } catch (error) {
      console.error(error);
      return interaction.editReply('Gelikete nummers ophalen mislukt.');
    }
  },
};
