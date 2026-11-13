let accessToken = null;
let expiresAt = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < expiresAt) {
    return accessToken;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body,
  });

  if (!response.ok) throw new Error('Spotify login mislukt');

  const data = await response.json();
  accessToken = data.access_token;
  expiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return accessToken;
}

async function getSpotifyTrack(link) {
  const match = link.match(/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)/);
  if (!match) return null;

  const token = await getAccessToken();
  const response = await fetch('https://api.spotify.com/v1/tracks/' + match[1], {
    headers: { Authorization: 'Bearer ' + token },
  });

  if (!response.ok) throw new Error('Spotify-nummer ophalen mislukt');

  const track = await response.json();
  return {
    title: track.name,
    artist: track.artists.map(artist => artist.name).join(', '),
    album: track.album.name,
    releaseDate: track.album.release_date,
  };
}

module.exports = { getSpotifyTrack };
