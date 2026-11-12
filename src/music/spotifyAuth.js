const http = require('node:http');
const crypto = require('node:crypto');

const pendingLogins = new Map();
const userTokens = new Map();

function createLoginUrl(discordUserId) {
  const state = crypto.randomBytes(16).toString('hex');

  pendingLogins.set(state, discordUserId);

  const scopes = [
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: scopes,
    state: state,
  });

  return 'https://accounts.spotify.com/authorize?' + params.toString();
}

async function exchangeCode(code) {
  const credentials = Buffer.from(
    process.env.SPOTIFY_CLIENT_ID +
      ':' +
      process.env.SPOTIFY_CLIENT_SECRET
  ).toString('base64');

  const response = await fetch(
    'https://accounts.spotify.com/api/token',
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + credentials,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Spotify token ophalen mislukt');
  }

  return response.json();
}

function getUserToken(discordUserId) {
  return userTokens.get(discordUserId);
}

async function getUserPlaylists(discordUserId) {
  const tokenData = getUserToken(discordUserId);

  if (!tokenData) {
    return null;
  }

  const response = await fetch(
    'https://api.spotify.com/v1/me/playlists?limit=10',
    {
      headers: {
        Authorization: 'Bearer ' + tokenData.accessToken,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Spotify playlists ophalen mislukt');
  }

  const data = await response.json();

  return data.items;
}

function startSpotifyAuthServer() {
  const server = http.createServer(async function (req, res) {
    const url = new URL(req.url, 'http://127.0.0.1:8888');

    if (url.pathname !== '/callback') {
      res.writeHead(404);
      res.end('Niet gevonden');
      return;
    }

    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state || !pendingLogins.has(state)) {
      res.writeHead(400);
      res.end('Spotify koppeling mislukt.');
      return;
    }

    const discordUserId = pendingLogins.get(state);

    try {
      const tokenData = await exchangeCode(code);

      userTokens.set(discordUserId, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt:
          Date.now() + tokenData.expires_in * 1000,
      });

      pendingLogins.delete(state);

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
      });

      res.end(`
        <h1>Spotify gekoppeld</h1>
        <p>Je Spotify-account is gekoppeld aan Jammer.</p>
        <p>Je kunt dit venster nu sluiten.</p>
      `);
    } catch (error) {
      console.error(error);

      res.writeHead(500);
      res.end('Spotify koppeling mislukt.');
    }
  });

  server.listen(8888, '127.0.0.1', function () {
    console.log('Spotify loginserver gestart op poort 8888');
  });
}

module.exports = {
  createLoginUrl,
  getUserToken,
  getUserPlaylists,
  startSpotifyAuthServer,
};