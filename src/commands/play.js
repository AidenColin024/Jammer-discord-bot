const { SlashCommandBuilder } = require('discord.js');
const { searchTrack } = require('../music/ytdlp');
const { getSpotifyTrack } = require('../music/spotify');
const { joinChannel, addTrack } = require('../music/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Speel een nummer af of zet het in de wachtrij')
    .addStringOption(function (option) {
      return option
        .setName('nummer')
        .setDescription('Zoekterm, YouTube-link of Spotify-link')
        .setRequired(true);
    }),

  async execute(interaction) {
    const text = interaction.options.getString('nummer');
    const channel = interaction.member.voice.channel;

    if (!channel) {
      await interaction.reply('Ga eerst in een spraakkanaal zitten.');
      return;
    }

    await interaction.deferReply();

    let track;

    try {
      // Spotify track-link
      if (text.includes('open.spotify.com/track/')) {
        const spotifyTrack = await getSpotifyTrack(text);

        if (!spotifyTrack) {
          await interaction.editReply(
            'Ik kon dit Spotify-nummer niet vinden.'
          );
          return;
        }

        // Zoek het Spotify-nummer op YouTube
        const search =
          spotifyTrack.title + ' ' + spotifyTrack.artist;

        track = await searchTrack(search);

        if (track) {
          // Gebruik de correcte informatie van Spotify
          track.title = spotifyTrack.title;
          track.artist = spotifyTrack.artist;
          track.album = spotifyTrack.album;
          track.releaseDate = spotifyTrack.releaseDate;
        }
      }

      // Andere Spotify-links ondersteunen we nog niet
      else if (text.includes('open.spotify.com/')) {
        await interaction.editReply(
          'Deze Spotify-link wordt nog niet ondersteund. Gebruik voorlopig een Spotify-link van één nummer.'
        );
        return;
      }

      // Normale zoekterm of YouTube-link
      else {
        track = await searchTrack(text);
      }
    } catch (error) {
      console.log('Fout bij zoeken:', error);

      await interaction.editReply(
        'Er ging iets mis bij het zoeken.'
      );
      return;
    }

    if (!track) {
      await interaction.editReply(
        'Niets gevonden voor: ' + text
      );
      return;
    }

    const server = joinChannel(channel);
    const position = addTrack(server, track);

    if (position === 0) {
      await interaction.editReply(
        'Speelt nu: ' +
          track.title +
          ' - ' +
          track.artist
      );
    } else {
      await interaction.editReply(
        'Op plek ' +
          position +
          ' in de wachtrij: ' +
          track.title +
          ' - ' +
          track.artist
      );
    }
  },
};