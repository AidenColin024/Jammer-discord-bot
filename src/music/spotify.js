let accessToken = null;
let tokenExpires = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpires) {
    return accessToken;
  }

  const response = await fetch(
    'https://accounts.spotify.com/api/token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body:
        'grant_type=client_credentials' +
        '&client_id=' +
        encodeURIComponent(process.env.SPOTIFY_CLIENT_ID) +
        '&client_secret=' +
        encodeURIComponent(process.env.SPOTIFY_CLIENT_SECRET),
    }
  );

  if (!response.ok) {
    throw new Error('Spotify login mislukt');
  }

  const data = await response.json();

  accessToken = data.access_token;
  tokenExpires = Date.now() + (data.expires_in - 60) * 1000;

  return accessToken;
}

function getSpotifyTrackId(url) {
  const match = url.match(
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)/
  );

  if (!match) {
    return null;
  }

  return match[1];
}

async function getSpotifyTrack(url) {
  const trackId = getSpotifyTrackId(url);

  if (!trackId) {
    return null;
  }

  const token = await getAccessToken();

  const response = await fetch(
    'https://api.spotify.com/v1/tracks/' + trackId,
    {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      'Spotify nummer kon niet worden opgehaald'
    );
  }

  const track = await response.json();

  return {
    title: track.name,
    artist: track.artists
      .map((artist) => artist.name)
      .join(', '),
    album: track.album.name,
    releaseDate: track.album.release_date,
  };
}

module.exports = {
  getSpotifyTrack,
};