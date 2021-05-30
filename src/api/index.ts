import { Router, static as Static } from 'express';
import { join } from 'path';

import routes from './routes';

const api = Router();

api.use('/', Static(join(__dirname, '../../assets')));

api.use('/', routes);

module.exports = api;
