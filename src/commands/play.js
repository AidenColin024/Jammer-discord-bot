const { SlashCommandBuilder } = require('discord.js');
const { searchTrack } = require('../music/ytdlp');
const { joinChannel, addTrack } = require('../music/player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Speel een nummer af of zet het in de wachtrij')
    .addStringOption(function (option) {
      return option
        .setName('nummer')
        .setDescription('Zoekterm of YouTube-link')
        .setRequired(true);
    }),

  async execute(interaction) {
    const text = interaction.options.getString('nummer');
    const channel = interaction.member.voice.channel;

    if (!channel) {
      await interaction.reply('Ga eerst in een spraakkanaal zitten.');
      return;
    }

    if (text.includes('spotify')) {
      await interaction.reply(
        'Spotify-links werken nog niet. Gebruik een zoekterm of YouTube-link.'
      );
      return;
    }

    await interaction.deferReply();

    let track;

    try {
      track = await searchTrack(text);
    } catch (error) {
      console.log(error);
      await interaction.editReply('Er ging iets mis bij het zoeken.');
      return;
    }

    if (!track) {
      await interaction.editReply('Niets gevonden voor: ' + text);
      return;
    }

    const server = joinChannel(channel);
    const position = addTrack(server, track);

    if (position === 0) {
      await interaction.editReply(
        'Speelt nu: ' + track.title + ' - ' + track.artist
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