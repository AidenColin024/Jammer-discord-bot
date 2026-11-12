const youtubedl = require('youtube-dl-exec');

function isUrl(text) {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

// Zoekt een nummer op (zoekterm of link) en geeft de gegevens terug
async function resolveTrack(query) {
  const target = isUrl(query) ? query : `ytsearch1:${query}`;

  const info = await youtubedl(target, {
    dumpSingleJson: true,
    noWarnings: true,
    noPlaylist: true,
    skipDownload: true,
    format: 'bestaudio',
  });

  // Bij een zoekopdracht komt het resultaat in een lijst (entries)
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

// Start een audiostream van een YouTube-link
function createStream(url) {
  const proc = youtubedl.exec(
    url,
    { output: '-', format: 'bestaudio', quiet: true, noPlaylist: true },
    { stdio: ['ignore', 'pipe', 'ignore'] }
  );
  proc.catch(() => {}); // voorkomt een crash als we het proces stoppen
  return proc;
}

module.exports = { resolveTrack, createStream };