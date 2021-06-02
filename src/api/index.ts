import { Router, static as Static } from 'express';
import session from 'express-session';
import passport from 'passport';
import passportDiscord from 'passport-discord';
import { join } from 'path';

import { client, config } from '../index';
import routes from './routes';

const api = Router();

passport.use(
  new passportDiscord.Strategy(
    {
      clientID: client.user!.id,
      clientSecret: config.SECRET,
      callbackURL: config.WEBSITE + config.CALLBACK,
      scope: 'identify guilds'
    },
    (accessToken, refreshToken, profile, done) => {
      // User logged in
      process.nextTick(() => {
        return done(null, profile);
      });
    }
  )
);

api.use(
  session({
    secret: config.COOKIESECRET,
    resave: false,
    saveUninitialized: false
  })
);

api.use(passport.initialize());

api.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

api.get(
  config.CALLBACK,
  passport.authenticate('discord', {
    failureRedirect: '/'
  }),
  function (req, res) {
    res.redirect('/dashboard');
  }
);

passport.deserializeUser((obj, done) => {
  done(null, <Express.User>obj);
});

api.use('/', Static(join(__dirname, '../../assets')));

api.use('/', routes);

export default api;
