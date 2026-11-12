const { SlashCommandBuilder } = require('discord.js');
const { createLoginUrl } = require('../music/spotifyAuth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spotify-login')
    .setDescription('Koppel je Spotify-account aan Jammer'),

  async execute(interaction) {
    const loginUrl = createLoginUrl(interaction.user.id);

    await interaction.reply({
      content:
        'Koppel je Spotify-account via deze link:\n' +
        loginUrl,
      ephemeral: true,
    });
  },
};