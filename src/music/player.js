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

// Per server (guild) één speler
const guilds = new Map();

function getGuildPlayer(guildId) {
  return guilds.get(guildId);
}

async function connect(voiceChannel) {
  const guildId = voiceChannel.guild.id;
  const existing = guilds.get(guildId);

  // Al in hetzelfde kanaal? Hergebruik de verbinding
  if (existing && existing.connection.joinConfig.channelId === voiceChannel.id) {
    return existing;
  }
  // In een ander kanaal? Eerst netjes weggaan
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

  const gp = { connection, player, current: null, process: null };

  player.on('error', (err) => console.error('Audiofout:', err.message));

  // Nummer afgelopen
  player.on(AudioPlayerStatus.Idle, () => {
    gp.current = null;
    if (gp.process) gp.process.kill();
    gp.process = null;
    // 👉 Hier komt bij feature 3 het volgende nummer uit de wachtrij
  });

  // Verbinding kwijt (bijv. bot uit kanaal gesleept)
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

  // Pas na het starten van het nieuwe nummer het oude proces stoppen
  if (oldProcess) oldProcess.kill();
}

function destroy(guildId) {
  const gp = guilds.get(guildId);
  if (!gp) return;
  if (gp.process) gp.process.kill();
  gp.player.stop(true);
  if (gp.connection.state.status !== VoiceConnectionStatus.Destroyed) {
    gp.connection.destroy();
  }
  guilds.delete(guildId);
}

module.exports = { connect, play, destroy, getGuildPlayer };