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

  // Bot zit al in hetzelfde kanaal
  if (
    existing &&
    existing.connection.joinConfig.channelId === voiceChannel.id
  ) {
    return existing;
  }

  if (existing) {
    destroy(guildId);
  }

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  await entersState(
    connection,
    VoiceConnectionStatus.Ready,
    20_000
  );

  const player = createAudioPlayer();

  connection.subscribe(player);

  const gp = {
    connection,
    player,
    current: null,
    process: null,

    // Hier bewaren we nummers die nog moeten spelen
    queue: [],
  };

  player.on('error', (error) => {
    console.error('Audiofout:', error.message);
  });

  // Als een nummer klaar is
  player.on(AudioPlayerStatus.Idle, () => {
    gp.current = null;

    if (gp.process) {
      gp.process.kill();
    }

    gp.process = null;

    // Speel automatisch volgende nummer
    playNext(gp);
  });

  connection.on(
    VoiceConnectionStatus.Disconnected,
    async () => {
      try {
        await Promise.race([
          entersState(
            connection,
            VoiceConnectionStatus.Signalling,
            5_000
          ),
          entersState(
            connection,
            VoiceConnectionStatus.Connecting,
            5_000
          ),
        ]);
      } catch {
        destroy(guildId);
      }
    }
  );

  guilds.set(guildId, gp);

  return gp;
}

function play(gp, track) {
  const oldProcess = gp.process;

  const proc = createStream(track.url);

  const resource = createAudioResource(
    proc.stdout,
    {
      inputType: StreamType.Arbitrary,
    }
  );

  gp.process = proc;
  gp.current = track;

  gp.player.play(resource);

  if (oldProcess) {
    oldProcess.kill();
  }
}

// Zet meerdere nummers in de wachtrij
function addToQueue(gp, tracks) {
  gp.queue.push(...tracks);

  // Als er niets speelt, meteen beginnen
  if (!gp.current) {
    playNext(gp);
  }
}

// Pakt het eerste nummer uit de wachtrij
function playNext(gp) {
  if (gp.current) return;

  const nextTrack = gp.queue.shift();

  if (!nextTrack) return;

  play(gp, nextTrack);
}

function destroy(guildId) {
  const gp = guilds.get(guildId);

  if (!gp) return;

  if (gp.process) {
    gp.process.kill();
  }

  gp.player.stop(true);

  if (
    gp.connection.state.status !==
    VoiceConnectionStatus.Destroyed
  ) {
    gp.connection.destroy();
  }

  guilds.delete(guildId);
}

module.exports = {
  connect,
  play,
  destroy,
  getGuildPlayer,
  addToQueue,
  playNext,
};