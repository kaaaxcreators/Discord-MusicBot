import { Router } from 'express';
import { join } from 'path';

import { client, commands, config } from '../index';

const Commands = Array.from(commands.mapValues((value) => value.info).values());

const api = Router();

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
