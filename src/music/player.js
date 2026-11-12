const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  entersState,
  StreamType,
  AudioPlayerStatus,
  VoiceConnectionStatus,
} = require('@discordjs/voice');
const { createStream } = require('./ytdlp');

const guilds = new Map();

function getGuildPlayer(guildId) {
  return guilds.get(guildId);
}

async function connect(voiceChannel) {
  const guildId = voiceChannel.guild.id;
  const existing = guilds.get(guildId);

  if (existing && existing.connection.joinConfig.channelId === voiceChannel.id) {
    return existing;
  }
  if (existing) destroy(guildId);

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

  const player = createAudioPlayer();
  connection.subscribe(player);

  const gp = { connection, player, current: null, process: null, queue: [] };

  player.on('error', (err) => console.error('Audiofout:', err.message));

  player.on(AudioPlayerStatus.Idle, () => {
    if (gp.process) gp.process.kill();
    gp.process = null;
    gp.current = null;

    const next = gp.queue.shift();
    if (next) play(gp, next);
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      destroy(guildId);
    }
  });

  guilds.set(guildId, gp);
  return gp;
}

function play(gp, track) {
  const oldProcess = gp.process;

  const proc = createStream(track.url);
  const resource = createAudioResource(proc.stdout, { inputType: StreamType.Arbitrary });

  gp.process = proc;
  gp.current = track;
  gp.player.play(resource);

  if (oldProcess) oldProcess.kill();
}

function addTrack(gp, track) {
  if (!gp.current) {
    play(gp, track);
    return 0;
  }
  gp.queue.push(track);
  return gp.queue.length;
}

function destroy(guildId) {
  const gp = guilds.get(guildId);
  if (!gp) return;
  gp.queue = [];
  if (gp.process) gp.process.kill();
  gp.player.stop(true);
  if (gp.connection.state.status !== VoiceConnectionStatus.Destroyed) {
    gp.connection.destroy();
  }
  guilds.delete(guildId);
}

module.exports = { connect, addTrack, destroy, getGuildPlayer };