const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} = require('@discordjs/voice');

const { startStream } = require('./ytdlp');

const servers = {};

function getServer(guildId) {
  return servers[guildId];
}

function joinChannel(channel) {
  const guildId = channel.guild.id;
  const existing = servers[guildId];

  // Bot zit al in hetzelfde kanaal
  if (existing && existing.channelId === channel.id) {
    return existing;
  }

  // Oude verbinding afsluiten
  if (existing) {
    leave(guildId);
  }

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guildId,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  const player = createAudioPlayer();

  connection.subscribe(player);

  const server = {
    channelId: channel.id,
    connection: connection,
    player: player,
    current: null,
    stream: null,
    queue: [],
  };

  // Als een nummer klaar is, volgende nummer starten
  player.on(AudioPlayerStatus.Idle, function () {
    playNext(server);
  });

  player.on('error', function (error) {
    console.log('Audiofout: ' + error.message);
  });

  connection.on(VoiceConnectionStatus.Disconnected, function () {
    leave(guildId);
  });

  servers[guildId] = server;

  return server;
}

function playNext(server) {
  if (server.stream) {
    server.stream.kill();
  }

  server.stream = null;
  server.current = null;

  if (server.queue.length === 0) {
    return;
  }

  const track = server.queue.shift();

  server.stream = startStream(track.url);
  server.current = track;

  server.player.play(
    createAudioResource(server.stream.stdout)
  );
}

// Eén nummer toevoegen
function addTrack(server, track) {
  server.queue.push(track);

  if (server.current === null) {
    playNext(server);
    return 0;
  }

  return server.queue.length;
}

// Meerdere nummers tegelijk toevoegen
// Deze gebruiken we voor playlists
function addTracks(server, tracks) {
  server.queue.push(...tracks);

  if (server.current === null) {
    playNext(server);
  }

  return server.queue.length;
}

function leave(guildId) {
  const server = servers[guildId];

  if (!server) {
    return;
  }

  server.queue = [];

  if (server.stream) {
    server.stream.kill();
  }

  server.player.stop();
  server.connection.destroy();

  delete servers[guildId];
}

module.exports = {
  getServer,
  joinChannel,
  addTrack,
  addTracks,
  leave,
};