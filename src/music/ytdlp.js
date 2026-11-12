const youtubedl = require('youtube-dl-exec');

async function searchTrack(text) {
  let search = text;
  if (!text.startsWith('http')) {
    search = 'ytsearch1:' + text;
  }

  const info = await youtubedl(search, {
    dumpSingleJson: true,
    noWarnings: true,
    noPlaylist: true,
    skipDownload: true,
  });

  let video = info;
  if (info.entries) {
    video = info.entries[0];
  }

  if (!video) {
    return null;
  }

  return {
    title: video.track || video.title,
    artist: video.artist || video.uploader || 'Onbekend',
    album: video.album || 'Onbekend',
    releaseDate: video.release_date || null,
    duration: video.duration || 0,
    url: video.webpage_url,
  };
}

function startStream(url) {
  const stream = youtubedl.exec(
    url,
    { output: '-', format: 'bestaudio', quiet: true },
    { stdio: ['ignore', 'pipe', 'ignore'] }
  );
  stream.catch(function () {});
  return stream;
}

module.exports = { searchTrack, startStream };