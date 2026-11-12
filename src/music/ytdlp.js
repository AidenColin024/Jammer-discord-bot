const youtubedl = require('youtube-dl-exec');

function isUrl(text) {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

// Zoekt één nummer op
async function resolveTrack(query) {
  const target = isUrl(query) ? query : `ytsearch1:${query}`;

  const info = await youtubedl(target, {
    dumpSingleJson: true,
    noWarnings: true,
    noPlaylist: true,
    skipDownload: true,
    format: 'bestaudio',
  });

  const entry = info.entries ? info.entries[0] : info;

  if (!entry) return null;

  return {
    title: entry.track || entry.title,
    artist: entry.artist || entry.uploader || entry.channel || 'Onbekend',
    album: entry.album || null,
    releaseDate: entry.release_date || entry.upload_date || null,
    duration: entry.duration || 0,
    url: entry.webpage_url,
    thumbnail: entry.thumbnail,
  };
}

// Haalt alle nummers uit een playlist
async function resolvePlaylist(url) {
  const info = await youtubedl(url, {
    dumpSingleJson: true,
    flatPlaylist: true,
    skipDownload: true,
    noWarnings: true,
  });

  if (!info.entries) return [];

  return info.entries.map((entry) => ({
    title: entry.title || 'Onbekend nummer',
    artist: entry.uploader || entry.channel || 'Onbekend',
    album: null,
    releaseDate: null,
    duration: entry.duration || 0,
    url: entry.url.startsWith('http')
      ? entry.url
      : `https://www.youtube.com/watch?v=${entry.id}`,
    thumbnail: entry.thumbnail || null,
  }));
}

// Start audiostream
function createStream(url) {
  const proc = youtubedl.exec(
    url,
    {
      output: '-',
      format: 'bestaudio',
      quiet: true,
      noPlaylist: true,
    },
    {
      stdio: ['ignore', 'pipe', 'ignore'],
    }
  );

  proc.catch(() => {});

  return proc;
}

module.exports = {
  resolveTrack,
  resolvePlaylist,
  createStream,
};