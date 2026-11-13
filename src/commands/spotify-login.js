const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { createLoginUrl } = require('../music/spotifyAuth');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('spotify-login')
    .setDescription('Koppel je Spotify-account aan Jammer'),

  async execute(interaction) {

    // Laat Discord weten dat de bot bezig is
    await interaction.deferReply({
      flags: MessageFlags.Ephemeral
    });

    // Maak de Spotify-loginlink
    const loginUrl = createLoginUrl(interaction.user.id);

    // Stuur de link naar de gebruiker
    await interaction.editReply(
      'Koppel je Spotify-account via deze link:\n' + loginUrl
    );
  },
};