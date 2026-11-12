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

async function resolvePlaylist(url) {
  const info = await youtubedl(url, {
    dumpSingleJson: true,
    flatPlaylist: true,
    skipDownload: true,
    noWarnings: true,
  });

  if (!info.entries) {
    return [];
  }

  return info.entries
    .filter((entry) => entry)
    .map((entry) => ({
      title: entry.title || 'Onbekend nummer',
      artist: entry.uploader || entry.channel || 'Onbekend',
      album: null,
      releaseDate: null,
      duration: entry.duration || 0,
      url:
        entry.url && entry.url.startsWith('http')
          ? entry.url
          : `https://www.youtube.com/watch?v=${entry.id}`,
      thumbnail: entry.thumbnail || null,
    }));
}

function startStream(url) {
  const stream = youtubedl.exec(
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

  stream.catch(function () {});

  return stream;
}

module.exports = {
  searchTrack,
  resolvePlaylist,
  startStream,
};