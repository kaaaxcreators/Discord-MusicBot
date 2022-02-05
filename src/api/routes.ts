import connectLivereload from 'connect-livereload';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import livereload from 'livereload';
import { join } from 'path';

import channelsController from './Controllers/channelsController.js';
import dashboardController from './Controllers/dashboardController.js';
import infoController from './Controllers/infoController.js';
import logoutController from './Controllers/logoutController.js';
import mainController from './Controllers/mainController.js';
import notFoundController from './Controllers/notFoundController.js';
import prefixController from './Controllers/prefixController.js';
import serverController from './Controllers/serverController.js';
import serversController from './Controllers/serversController.js';
import skipController from './Controllers/skipController.js';
import songController from './Controllers/songController.js';
import translationsController from './Controllers/translationsController.js';
import updateController from './Controllers/updateController.js';
import userController from './Controllers/userController.js';
import Auth from './Middlewares/Auth.js';
import * as CSRF from './Middlewares/CSRF.js';
import GuildActions from './Middlewares/GuildActions.js';

const api = Router();

const limiter = rateLimit({
  max: 500, // limit each IP to 500 requests per windowMs
  draft_polli_ratelimit_headers: true
});

api.use(limiter);

api.use(CSRF.Generate);

if (process.env.LIVERELOAD == 'true') {
  const server = livereload.createServer();
  server.watch([join(__dirname + '../../../views'), join(__dirname + '../../../assets')]);
  api.use(connectLivereload());
}

api.get('/', mainController);

api.get('/api/info', infoController);

api.get('/dashboard', Auth, dashboardController);

api.get('/servers', Auth, serversController);

api.get('/servers/:id', Auth, serverController);

api.get('/api/user', userController);

api.get('/api/translations', translationsController);

api.post('/api/prefix/:id/:prefix', GuildActions, CSRF.Verify, prefixController);

api.post('/api/queue/:id/add/:song', GuildActions, CSRF.Verify, songController);

api.post('/api/queue/:id/skip', GuildActions, CSRF.Verify, skipController);

api.get('/api/channels/:id', GuildActions, CSRF.Verify, channelsController);

api.get('/api/update', GuildActions, updateController);

api.get('/logout', logoutController);

// 404 Error Handling at the End
api.all('*', notFoundController);

export default api;
