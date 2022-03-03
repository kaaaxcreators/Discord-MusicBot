import connectLivereload from 'connect-livereload';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import livereload from 'livereload';
import { join } from 'path';
import { dirname as PathDirname } from 'path';
import { fileURLToPath } from 'url';

import channelsController from './Controllers/channelsController';
import dashboardController from './Controllers/dashboardController';
import infoController from './Controllers/infoController';
import logoutController from './Controllers/logoutController';
import mainController from './Controllers/mainController';
import notFoundController from './Controllers/notFoundController';
import prefixController from './Controllers/prefixController';
import serverController from './Controllers/serverController';
import serversController from './Controllers/serversController';
import skipController from './Controllers/skipController';
import songController from './Controllers/songController';
import translationsController from './Controllers/translationsController';
import updateController from './Controllers/updateController';
import userController from './Controllers/userController';
import Auth from './Middlewares/Auth';
import * as CSRF from './Middlewares/CSRF';
import GuildActions from './Middlewares/GuildActions';

const api = Router();

const limiter = rateLimit({
  max: 500, // limit each IP to 500 requests per windowMs
  draft_polli_ratelimit_headers: true
});

api.use(limiter);

api.use(CSRF.Generate);

const __dirname = PathDirname(fileURLToPath(import.meta.url));

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
