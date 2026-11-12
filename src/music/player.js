const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} = require('@discordjs/voice');
<<<<<<< HEAD

const { startStream } = require('./ytdlp');

const servers = {};

=======
const { startStream } = require('./ytdlp');

const servers = {};

>>>>>>> origin/dev
function getServer(guildId) {
  return servers[guildId];
}

function joinChannel(channel) {
  const guildId = channel.guild.id;
  const existing = servers[guildId];

  if (existing && existing.channelId === channel.id) {
    return existing;
  }

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
<<<<<<< HEAD

=======
>>>>>>> origin/dev
  return server;
}

function playNext(server) {
  if (server.stream) {
    server.stream.kill();
  }
<<<<<<< HEAD

=======
>>>>>>> origin/dev
  server.stream = null;
  server.current = null;

  if (server.queue.length === 0) {
    return;
  }

  const track = server.queue.shift();
<<<<<<< HEAD

  server.stream = startStream(track.url);
  server.current = track;

  server.player.play(
    createAudioResource(server.stream.stdout)
  );
=======
  server.stream = startStream(track.url);
  server.current = track;
  server.player.play(createAudioResource(server.stream.stdout));
>>>>>>> origin/dev
}

function addTrack(server, track) {
  server.queue.push(track);

  if (server.current === null) {
    playNext(server);
    return 0;
  }

  return server.queue.length;
}

<<<<<<< HEAD
function addTracks(server, tracks) {
  server.queue.push(...tracks);

  if (server.current === null) {
    playNext(server);
  }

  return server.queue.length;
}

function leave(guildId) {
  const server = servers[guildId];

=======
function leave(guildId) {
  const server = servers[guildId];
>>>>>>> origin/dev
  if (!server) {
    return;
  }

  server.queue = [];
<<<<<<< HEAD

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
=======
  server.player.stop();
  server.connection.destroy();
  delete servers[guildId];
}

module.exports = { getServer, joinChannel, addTrack, leave };
>>>>>>> origin/dev
