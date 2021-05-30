import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { join } from 'path';

import { client, commands, config } from '../index';

const Commands = Array.from(commands.mapValues((value) => value.info).values());

const api = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  draft_polli_ratelimit_headers: true
});

api.use(limiter);

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

api.get('/api/commands', (req, res) => {
  res.send({ commands: Commands });
});

export default api;
