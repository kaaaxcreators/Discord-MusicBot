import connectLivereload from 'connect-livereload';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import livereload from 'livereload';
import { join } from 'path';

import channelsController from './controller/channelsController';
import dashboardController from './controller/dashboardController';
import infoController from './controller/infoController';
import logoutController from './controller/logoutController';
import mainController from './controller/mainController';
import notFoundController from './controller/notFoundController';
import prefixController from './controller/prefixController';
import serverController from './controller/serverController';
import serversController from './controller/serversController';
import skipController from './controller/skipController';
import songController from './controller/songController';
import translationsController from './controller/translationsController';
import updateController from './controller/updateController';
import userController from './controller/userController';
import Auth from './Middlewares/Auth';
import * as CSRF from './Middlewares/CSRF';
import GuildActions from './Middlewares/GuildActions';

const api = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
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
