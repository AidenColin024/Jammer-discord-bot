const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const fs = require('fs');

// Maak de datamap als die nog niet bestaat
fs.mkdirSync('./data', { recursive: true });

const db = new DatabaseSync('./data/jammer.db');

// Maak de gebruikerstabel
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    discord_id TEXT PRIMARY KEY,
    spotify_connected INTEGER DEFAULT 0,
    favorite_playlist TEXT
  )
`);

// Voeg een kolom toe voor Spotify als die nog niet bestaat
const columns = db.prepare('PRAGMA table_info(users)').all();

if (!columns.some(column => column.name === 'spotify_token')) {
  db.exec('ALTER TABLE users ADD COLUMN spotify_token TEXT');
}

function saveUser(discordId) {
  db.prepare(
    'INSERT OR IGNORE INTO users (discord_id) VALUES (?)'
  ).run(discordId);
}

function getUser(discordId) {
  return db.prepare(
    'SELECT * FROM users WHERE discord_id = ?'
  ).get(discordId);
}

function savePlaylist(discordId, playlist) {
  saveUser(discordId);

  db.prepare(
    'UPDATE users SET favorite_playlist = ? WHERE discord_id = ?'
  ).run(playlist, discordId);
}

// Haal de beveiligingssleutel op
function getKey() {
  const key = process.env.SPOTIFY_ENCRYPTION_KEY;

  if (!key || !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error('Spotify beveiligingssleutel ontbreekt of is ongeldig');
  }

  return Buffer.from(key, 'hex');
}

// Versleutel een Spotify-token
function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted.toString('hex')
  ].join(':');
}

// Ontsleutel een Spotify-token
function decrypt(text) {
  const [iv, tag, encrypted] = text.split(':');

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getKey(),
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'hex')),
    decipher.final()
  ]).toString('utf8');
}

// Sla het Spotify-refresh-token op
function saveSpotifyToken(discordId, token) {
  saveUser(discordId);

  db.prepare(`
    UPDATE users
    SET spotify_token = ?, spotify_connected = 1
    WHERE discord_id = ?
  `).run(encrypt(token), discordId);
}

// Haal het opgeslagen Spotify-token op
function getSpotifyToken(discordId) {
  const user = getUser(discordId);

  if (!user || !user.spotify_token) {
    return null;
  }

  return decrypt(user.spotify_token);
}

function deleteSpotifyToken(discordId) {
  db.prepare(`
    UPDATE users
    SET spotify_token = NULL, spotify_connected = 0
    WHERE discord_id = ?
  `).run(discordId);
}

module.exports = {
  saveUser,
  getUser,
  savePlaylist,
  saveSpotifyToken,
  getSpotifyToken,
  deleteSpotifyToken
};