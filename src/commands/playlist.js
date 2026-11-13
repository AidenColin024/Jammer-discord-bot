const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { resolvePlaylist } = require('../music/ytdlp');
const { joinChannel, addTracks } = require('../music/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Voeg een YouTube-playlist toe aan de wachtrij')
    .addStringOption(option =>
      option.setName('link')
        .setDescription('Link naar een YouTube-playlist')
        .setRequired(true)
    ),

  async execute(interaction) {
    const link = interaction.options.getString('link');
    const channel = interaction.member.voice.channel;

    if (!channel) {
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

      if (tracks.length === 0) {
        return interaction.editReply('Geen nummers gevonden in de playlist.');
      }

      const server = joinChannel(channel);
      addTracks(server, tracks);
      return interaction.editReply(tracks.length + ' nummers toegevoegd aan de wachtrij.');
    } catch (error) {
      console.error(error);
      return interaction.editReply('De playlist kon niet worden geladen.');
    }
  },
};
