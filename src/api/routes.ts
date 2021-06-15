import connectLivereload from 'connect-livereload';
import { Permissions } from 'discord.js';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import i18n from 'i18n';
import livereload from 'livereload';
import { join } from 'path';

import { client, commands, config } from '../index';
import database, { getGuild } from '../util/database';
i18n.setLocale(config.LOCALE);

import Auth from './Middlewares/Auth';

const Commands = Array.from(commands.mapValues((value) => value.info).values());

const api = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  draft_polli_ratelimit_headers: true
});

api.use(limiter);

if (process.env.LIVERELOAD == 'true') {
  const server = livereload.createServer();
  server.watch([join(__dirname + '../../../views'), join(__dirname + '../../../assets')]);
  api.use(connectLivereload());
}

api.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../../views/index.html'));
});

api.get('/api/info', (req, res) => {
  res.send({
    ClientID: client.user?.id,
    Permissions: config.PERMISSION,
    Scopes: config.SCOPES,
    Website: config.WEBSITE,
    CallbackURL: config.CALLBACK
  });
});

api.get('/dashboard', Auth, (req, res) => {
  res.sendFile(join(__dirname, '../../views/dashboard.html'));
});

api.get('/servers', Auth, (req, res) => {
  res.sendFile(join(__dirname, '../../views/servers.html'));
});

api.get('/servers/:id', Auth, (req, res) => {
  if (!req.user!.guilds!.find((x) => x.id == req.params.id)) {
    return res.redirect('/servers');
  }
  res.sendFile(join(__dirname, '../../views/server.html'));
});

api.get('/api/user', async (req, res) => {
  if (!req.user) {
    return res.send({});
  }
  req.user!.guilds!.map((g) => {
    g.hasPerms = new Permissions(g.permissions).has('MANAGE_GUILD', true);
    g.inGuild = client.guilds.cache.has(g.id);
    return g;
  });
  res.send({ user: req.user });
});

api.get('/api/commands', (req, res) => {
  res.send({ commands: Commands });
});

api.get('/api/translations', (req, res) => {
  res.send({ translations: i18n.getCatalog(config.LOCALE), locale: config.LOCALE });
});

api.post('/api/settings/:id', async (req, res) => {
  const prefix = <string | undefined>req.query.prefix;
  const id = req.params.id;
  const guildDB = await getGuild(id);
  // Check if valid request
  if (
    !prefix ||
    typeof prefix !== 'string' ||
    typeof Number.parseInt(id) !== 'number' ||
    isNaN(Number.parseInt(id))
  ) {
    return res.status(400).json({ status: 400 });
  } else if (!req.user || req.isUnauthenticated()) {
    res.status(401).json({ status: 401 });
  } else if (
    !req.user?.guilds
      ?.map((guildInfo) => ({
        id: guildInfo.id
      }))
      .some((arr) => arr.id == id)
  ) {
    res.status(403).json({ status: 403 });
  } else if (!guildDB) {
    res.status(500).json({ status: 500 });
  } else if (prefix == guildDB.prefix) {
    res.status(304).json({ status: 304 });
  } else {
    database.set(id, { prefix: prefix });
    return res.json({ prefix: prefix });
  }
});

api.get('/logout', (req, res) => {
  if (req.user) {
    req.logout();
  }
  res.redirect('/');
});

export default api;
