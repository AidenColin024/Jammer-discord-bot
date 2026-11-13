const http = require('node:http');
const crypto = require('node:crypto');

const {
  saveSpotifyToken,
  getSpotifyToken,
  deleteSpotifyToken
} = require('../database');

const pendingLogins = new Map();
const userTokens = new Map();

const redirectUri = 'http://127.0.0.1:8888/callback';

// Maak de Spotify-loginlink
function createLoginUrl(discordUserId) {
  const state = crypto.randomBytes(16).toString('hex');

  pendingLogins.set(state, discordUserId);

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: 'playlist-read-private playlist-read-collaborative user-library-read',
    state: state
  });

  console.log('Spotify redirect:', params.get('redirect_uri'));
  console.log('Spotify loginlink aangemaakt');

  return 'https://accounts.spotify.com/authorize?' + params.toString();
}

// Verstuur een aanvraag voor een Spotify-token
async function requestToken(body) {
  const login =
    process.env.SPOTIFY_CLIENT_ID + ':' +
    process.env.SPOTIFY_CLIENT_SECRET;

  const credentials = Buffer.from(login).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + credentials,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams(body)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    if (error.error === 'invalid_grant') {
      throw new Error('SPOTIFY_LOGIN_EXPIRED');
    }

    throw new Error('Spotify-token ophalen mislukt');
  }

  return response.json();
}

// Wissel de Spotify-logincode om voor tokens
async function exchangeCode(code) {
  return requestToken({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri
  });
}

// Haal een geldig token op
async function getUserToken(discordUserId) {
  const saved = userTokens.get(discordUserId);

  // Gebruik het bestaande token als het nog geldig is
  if (saved && Date.now() < saved.expiresAt - 60000) {
    return saved;
  }

  // Haal het refresh-token uit de database
  const refreshToken = getSpotifyToken(discordUserId);

  if (!refreshToken) {
    return null;
  }

  try {
    // Vraag automatisch een nieuw access token aan
    const data = await requestToken({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });

    // Spotify kan soms ook een nieuw refresh-token teruggeven
    if (data.refresh_token) {
      saveSpotifyToken(discordUserId, data.refresh_token);
    }

    const token = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000
    };

    userTokens.set(discordUserId, token);

    return token;
  } catch (error) {
    if (error.message === 'SPOTIFY_LOGIN_EXPIRED') {
      deleteSpotifyToken(discordUserId);
      userTokens.delete(discordUserId);
      return null;
    }

    throw error;
  }
}

// Haal persoonlijke playlists op
async function getUserPlaylists(discordUserId) {
  const token = await getUserToken(discordUserId);

  if (!token) {
    return null;
  }

  const response = await fetch(
    'https://api.spotify.com/v1/me/playlists?limit=10',
    {
      headers: {
        Authorization: 'Bearer ' + token.accessToken
      }
    }
  );

  if (!response.ok) {
    throw new Error('Playlists ophalen mislukt');
  }

  const data = await response.json();
  return data.items;
}

// Start de lokale Spotify-loginserver
function startSpotifyAuthServer() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, redirectUri);

    if (url.pathname !== '/callback') {
      res.writeHead(404);
      return res.end('Niet gevonden');
    }

    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state || !pendingLogins.has(state)) {
      res.writeHead(400);
      return res.end('Ongeldige Spotify-login');
    }

    const discordUserId = pendingLogins.get(state);
    pendingLogins.delete(state);

    try {
      const data = await exchangeCode(code);

      // Bewaar het refresh-token in de database
      saveSpotifyToken(discordUserId, data.refresh_token);

      // Bewaar het access token tijdelijk in het geheugen
      userTokens.set(discordUserId, {
        accessToken: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000
      });

      console.log('Spotify-account opgeslagen in database!');

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
      });

      res.end(
        '<h1>Spotify gekoppeld!</h1><p>Je kunt dit venster sluiten.</p>'
      );
    } catch (error) {
      console.error(error);
      res.writeHead(500);
      res.end('Spotify koppelen mislukt');
    }
  });

  server.listen(8888, '127.0.0.1', () => {
    console.log('Spotify loginserver gestart op poort 8888');
  });
}

module.exports = {
  createLoginUrl,
  getUserToken,
  getUserPlaylists,
  startSpotifyAuthServer
};