const { SlashCommandBuilder } = require('discord.js');
const { searchTrack } = require('../music/ytdlp');
const { getSpotifyTrack } = require('../music/spotify');
const { joinChannel, addTrack } = require('../music/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Speel een nummer af of voeg het toe aan de wachtrij')
    .addStringOption(option =>
      option.setName('nummer')
        .setDescription('Zoekterm, YouTube-link of Spotify-link')
        .setRequired(true)
    ),

  async execute(interaction) {
    const text = interaction.options.getString('nummer');
    const channel = interaction.member.voice.channel;

    if (!channel) {
      return interaction.reply('Ga eerst in een spraakkanaal zitten.');
    }

    await interaction.deferReply();

    try {
      let track;

      if (text.includes('open.spotify.com/')) {
        const spotifyTrack = await getSpotifyTrack(text);

        if (!spotifyTrack) {
          return interaction.editReply('Gebruik een Spotify-link van één nummer.');
        }

        // Spotify geeft de naam; YouTube levert de audio.
        track = await searchTrack(spotifyTrack.title + ' ' + spotifyTrack.artist);

        if (track) {
          track.title = spotifyTrack.title;
          track.artist = spotifyTrack.artist;
          track.album = spotifyTrack.album;
          track.releaseDate = spotifyTrack.releaseDate;
        }
      } else {
        track = await searchTrack(text);
      }

      if (!track) {
        return interaction.editReply('Geen nummer gevonden.');
      }

      const server = joinChannel(channel);
      const position = addTrack(server, track);
      const name = track.title + ' - ' + track.artist;

      if (position === 0) {
        return interaction.editReply('Speelt nu: ' + name);
      }

      return interaction.editReply('Op plek ' + position + ': ' + name);
    } catch (error) {
      console.error(error);
      return interaction.editReply('Er ging iets mis bij het zoeken.');
    }
  },
};
