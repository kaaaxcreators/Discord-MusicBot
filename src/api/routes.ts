import { entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { User } from '@oauth-everything/passport-discord/dist/ApiData';
import connectLivereload from 'connect-livereload';
import { MessageEmbed, Permissions, TextChannel, VoiceChannel } from 'discord.js';
import DiscordOauth2 from 'discord-oauth2';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import i18next from 'i18next';
import livereload from 'livereload';
import { join } from 'path';
import pMS from 'pretty-ms';

import { client, commands, config } from '../index';
import database, { getGuild } from '../util/database';
import sendError from '../util/error';
import { MusicSubscription, Track } from '../util/Music';
import Auth from './Middlewares/Auth';
import * as CSRF from './Middlewares/CSRF';
import GuildActions from './Middlewares/GuildActions';

const Commands = Array.from(commands.mapValues((value) => value.info).values());

const api = Router();

const oauth = new DiscordOauth2();

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

api.get('/', (req, res) => {
  const url = `https://discord.com/oauth2/authorize?client_id=${client.user?.id}&permissions=${
    config.PERMISSION
  }&scope=${config.SCOPES.join('%20')}&redirect_uri=${config.WEBSITE}${
    config.CALLBACK
  }&response_type=code`;
  res.render('main', {
    lang: config.LOCALE,
    filename: 'main',
    title: 'Discord Music Bot',
    url: url,
    commands: Commands.filter((v) => !v.hidden)
  });
});

api.get('/api/info', (req, res) => {
  res.send({
    ClientID: client.user?.id,
    Permissions: config.PERMISSION,
    Scopes: config.SCOPES,
    Website: config.WEBSITE,
    CallbackURL: config.CALLBACK,
    GuildActions: config.GUILDACTIONS
  });
});

api.get('/dashboard', Auth, (req, res) => {
  res.render('dashboard', {
    lang: config.LOCALE,
    filename: 'dashboard',
    title: 'Dashboard | Discord Music Bot',
    socket: true
  });
});

api.get('/servers', Auth, (req, res) => {
  res.render('servers', {
    locale: config.LOCALE,
    filename: 'servers',
    title: 'Servers | Discord Music Bot'
  });
});

api.get('/servers/:id', Auth, (req, res) => {
  if (!req.user!.guilds!.find((x) => x.id == req.params.id)) {
    return res.redirect('/servers');
  }
  res.render('server', {
    locale: config.LOCALE,
    filename: 'server',
    title: 'Server | Discord Music Bot',
    socket: true,
    csrf: req.session.csrf
  });
});

api.get('/api/user', async (req, res) => {
  if (!req.user) {
    return res.send({});
  }
  // Update every 5 Minutes or if lastUpdated doesnt exist
  if (
    !req.user.lastUpdated ||
    diff_minutes(new Date().toUTCString(), req.user.lastUpdated) >= config.UPDATEDIFF
  ) {
    const userGuilds = await oauth.getUserGuilds(req.user.accessToken!);
    req.user.guilds = userGuilds;
    req.user.lastUpdated = new Date().toUTCString();
    req.user!.guilds!.map((g) => {
      g.hasPerms = !!(
        g.permissions && new Permissions(BigInt(g.permissions)).has('MANAGE_GUILD', true)
      );
      g.inGuild = client.guilds.cache.has(g.id);
      return g;
    });
  }
  const merged = { ...req.user, ...(<User>req.user._json) };
  res.send({ user: merged });
});

api.get('/api/translations', (req, res) => {
  res.send({
    translations: i18next.getDataByLanguage(config.LOCALE)?.translation
  });
});

api.post('/api/prefix/:id/:prefix', GuildActions, CSRF.Verify, async (req, res) => {
  const { prefix, id } = req.params;
  const guildDB = await getGuild(id);
  const { config } = await import('../index');
  // Check if valid request
  if (
    typeof prefix !== 'string' ||
    typeof Number.parseInt(id) !== 'number' ||
    isNaN(Number.parseInt(id))
  ) {
    return res.status(400).json({ status: 400 });
  } else if (!req.user || req.isUnauthenticated() || !req.user.guilds) {
    res.status(401).json({ status: 401 });
  } else if (
    // check if is in guild and has perms and guild prefix is enabled
    (req.user.guilds
      .map((guildInfo) => ({
        id: guildInfo.id,
        hasPerms: guildInfo.hasPerms
      }))
      .find((arr) => arr.id == id) &&
      !req.user.guilds
        .map((guildInfo) => ({
          id: guildInfo.id,
          hasPerms: guildInfo.hasPerms
        }))
        .find((arr) => arr.id == id)!.hasPerms) ||
    !config.GUILDPREFIX
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

api.post('/api/queue/:id/add/:song', GuildActions, CSRF.Verify, async (req, res) => {
  const { id, song } = req.params;
  const vchannel = <string>req.query.vchannel;
  const mchannel = <string>req.query.mchannel;
  if (
    typeof id !== 'string' ||
    typeof Number.parseInt(id) !== 'number' ||
    isNaN(Number.parseInt(id))
  ) {
    return res.status(400).json({ status: 400 });
  } else if (!req.user || req.isUnauthenticated() || !req.user.guilds) {
    res.status(401).json({ status: 401 });
  } else if (
    // check if is in guild
    !req.user.guilds
      .map((guildInfo) => ({
        id: guildInfo.id,
        hasPerms: guildInfo.hasPerms
      }))
      .find((arr) => arr.id == id)
  ) {
    res.status(403).json({ status: 403 });
  } else {
    let subscription = (await import('../index')).queue.get(id);
    const Stats = (await import('../index')).Stats;
    const client = (await import('../index')).client;
    const user = await client.users.fetch(req.user.id);
    const Song = await Track.from(
      [escapeRegExp(song)],
      { author: user },
      {
        onStart(info) {
          const embed = new MessageEmbed()
            .setAuthor(
              i18next.t('music.started'),
              'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
            )
            .setThumbnail(info.img)
            .setColor('BLUE')
            .addField(i18next.t('music.name'), `[${info.title}](${info.url})`, true)
            .addField(
              i18next.t('music.duration'),
              info.live
                ? i18next.t('nowplaying.live')
                : pMS(info.duration, { secondsDecimalDigits: 0 }),
              true
            )
            .addField(i18next.t('music.request'), info.req.tag, true)
            .setFooter(`${i18next.t('music.views')} ${info.views} | ${info.ago}`);
          subscription!.textChannel.send({ embeds: [embed] });
        },
        onFinish() {
          Stats.songsPlayed++;
        },
        onError(error) {
          console.error(error);
          return sendError(error.message, subscription!.textChannel);
        }
      }
    );
    if (subscription) {
      subscription.enqueue(Song);
      const embed = new MessageEmbed()
        .setAuthor(
          'Song has been added to queue from Dashboard',
          'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        )
        .setThumbnail(Song.img!)
        .setColor('YELLOW')
        .addField(i18next.t('play.embed.name'), `[${Song.title}](${Song.url})`, true)
        .addField(
          i18next.t('play.embed.duration'),
          Song.live
            ? i18next.t('nowplaying.live')
            : pMS(Song.duration, { secondsDecimalDigits: 0 }),
          true
        )
        .addField(i18next.t('play.embed.request'), Song.req.tag, true)
        .setFooter(`${i18next.t('play.embed.views')} ${Song.views} | ${Song.ago}`);
      subscription.textChannel.send({ embeds: [embed] });
      return res.json(Song);
    } else {
      if (mchannel && vchannel) {
        const textChannel =
          <TextChannel>client.channels.cache.get(mchannel) ||
          <TextChannel>await client.channels.fetch(mchannel);
        const voiceChannel =
          <VoiceChannel>client.channels.cache.get(vchannel) ||
          <VoiceChannel>await client.channels.fetch(vchannel);
        const guildMember =
          client.guilds.cache.get(id)?.members.cache.get(user.id) ||
          (await (await client.guilds.fetch(id)).members.fetch(user.id));
        if (!guildMember) {
          return res.status(401).json({ status: 401 });
        }
        if (
          // check if channels are valid and if user has perms
          textChannel?.type === 'GUILD_TEXT' &&
          voiceChannel?.type === 'GUILD_VOICE' &&
          textChannel.permissionsFor(guildMember)?.has('SEND_MESSAGES') &&
          voiceChannel.permissionsFor(guildMember)?.has('SPEAK')
        ) {
          subscription = new MusicSubscription(
            joinVoiceChannel({
              channelId: voiceChannel.id,
              guildId: id,
              adapterCreator: guildMember.guild.voiceAdapterCreator
            }),
            voiceChannel,
            textChannel
          );
          subscription.voiceConnection.on('error', (error) => {
            console.warn(error);
          });
          (await import('../index')).queue.set(id, subscription);
          subscription.enqueue(Song);
          try {
            await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 10e3);
          } catch (error) {
            console.error(error);
            return res
              .status(500)
              .json({ status: 'Failed to Join the Voice Channel within 10 seconds' });
          }
          return res.json({ status: 200 });
        } else {
          return res.status(400).json({ status: 400 });
        }
      } else {
        return res.status(400).json({ status: 400 });
      }
    }
  }
});

api.post('/api/queue/:id/skip', GuildActions, CSRF.Verify, async (req, res) => {
  const { id } = req.params;
  if (
    typeof id !== 'string' ||
    typeof Number.parseInt(id) !== 'number' ||
    isNaN(Number.parseInt(id))
  ) {
    return res.status(400).json({ status: 400 });
  } else if (!req.user || req.isUnauthenticated() || !req.user.guilds) {
    res.status(401).json({ status: 401 });
  } else if (
    // check if is in guild
    !req.user.guilds
      .map((guildInfo) => ({
        id: guildInfo.id,
        hasPerms: guildInfo.hasPerms
      }))
      .find((arr) => arr.id == id)
  ) {
    res.status(403).json({ status: 403 });
  } else {
    const serverQueue = (await import('../index')).queue.get(id);
    if (serverQueue && serverQueue.voiceConnection && serverQueue.audioPlayer) {
      try {
        serverQueue.skip();
      } catch {
        serverQueue.voiceChannel.guild.me?.voice.disconnect();
        (await import('../index')).queue.delete(id);
      }
    } else {
      return res.status(501).json({ status: 501 });
    }
  }
});

api.get('/api/channels/:id', GuildActions, CSRF.Verify, async (req, res) => {
  const { id } = req.params;
  if (
    typeof id !== 'string' ||
    typeof Number.parseInt(id) !== 'number' ||
    isNaN(Number.parseInt(id))
  ) {
    res.status(400).json({ status: 400 });
  } else if (!req.user || req.isUnauthenticated() || !req.user.guilds) {
    res.status(401).json({ status: 401 });
  } else if (
    // check if is in guild
    !req.user.guilds
      .map((guildInfo) => ({
        id: guildInfo.id,
        hasPerms: guildInfo.hasPerms
      }))
      .find((arr) => arr.id == id)
  ) {
    res.status(403).json({ status: 403 });
  } else {
    const client = (await import('../index')).client;
    const guild = client.guilds.cache.get(id) || (await client.guilds.fetch(id));
    const user = guild.members.cache.get(req.user.id) || (await guild.members.fetch(req.user.id)!);
    const channels = guild.channels.cache!;
    const currentVoiceChannel = user.voice.channel;
    const textChannels = channels
      ?.filter(
        (channel) =>
          channel.type == 'GUILD_TEXT' &&
          !!channel.permissionsFor(user) &&
          channel.permissionsFor(user)!.has('SEND_MESSAGES')
      )
      .map((v) => ({ id: v.id, name: v.name }));
    const voiceChannels = channels
      ?.filter(
        (channel) =>
          channel.type == 'GUILD_VOICE' &&
          !!channel.permissionsFor(user) &&
          channel.permissionsFor(user)!.has('SPEAK')
      )
      .map((v) => ({ id: v.id, name: v.name }));
    res.json({
      status: 200,
      channels: textChannels?.concat(voiceChannels),
      textChannels,
      voiceChannels,
      currentVoiceChannel
    });
  }
});

api.get('/api/update', GuildActions, async (req, res) => {
  if (!req.user || req.isUnauthenticated() || !req.user.guilds || !req.user.refreshToken) {
    res.status(401).json({ status: 401 });
  } else {
    (await import('./index')).passportOAuth2Refresh.requestNewAccessToken(
      'discord',
      req.user.refreshToken,
      (err, accessToken, refreshToken) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ status: 500 });
        }
        req.user!.accessToken = accessToken;
        req.user!.refreshToken = refreshToken;
        return res.json({ status: 200 });
      }
    );
  }
});

api.get('/logout', (req, res) => {
  if (req.user) {
    req.logout();
  }
  res.redirect('/');
});

// 404 Error Handling at the End
api.all('*', (req, res) => {
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('404', { layout: false, lang: config.LOCALE, title: '404' });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.json({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

/**
 * Escape Regex String
 * @author <https://stackoverflow.com/a/3561711> - Modified
 */
function escapeRegExp(string: string) {
  return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Calculate Difference in Minutes of two UTC Strings
 * @author <https://www.w3resource.com/javascript-exercises/javascript-date-exercise-44.php> - Modified
 */
function diff_minutes(dt2: string, dt1: string) {
  let diff = (Date.parse(dt2) - Date.parse(dt1)) / 1000;
  diff /= 60;
  return Math.abs(Math.round(diff));
}

export default api;
