import { User } from '@oauth-everything/passport-discord/dist/ApiData';
import connectLivereload from 'connect-livereload';
import { MessageEmbed, Permissions, TextChannel, Util, VoiceChannel } from 'discord.js';
import DiscordOauth2 from 'discord-oauth2';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import i18next from 'i18next';
import livereload from 'livereload';
import millify from 'millify';
import moment from 'moment';
import { join } from 'path';
import pMS from 'pretty-ms';
import scdl from 'soundcloud-downloader/dist/index';
import spdl from 'spdl-core';
import yts from 'yt-search';
import ytdl from 'ytdl-core';

import { client, commands, config, IQueue } from '../index';
import database, { getGuild } from '../util/database';
import play, { Song } from '../util/playing';
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
    commands: Commands
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
      g.hasPerms = new Permissions(g.permissions).has('MANAGE_GUILD', true);
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
    await database.set(id, { prefix: prefix });
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
    const serverQueue = (await import('../index')).queue.get(id);
    const client = (await import('../index')).client;
    const user = await client.users.fetch(req.user.id);
    let Song: Song;
    let songInfo;
    if (song.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi)) {
      try {
        songInfo = await ytdl.getInfo(song);
        if (!songInfo) {
          return res.status(404).json({ status: 404 });
        }
        Song = {
          id: songInfo.videoDetails.videoId,
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          img: songInfo.player_response.videoDetails.thumbnail.thumbnails[0].url,
          duration: Number(songInfo.videoDetails.lengthSeconds) * 1000,
          ago: moment(songInfo.videoDetails.publishDate).fromNow(),
          views: millify(Number(songInfo.videoDetails.viewCount)),
          live: songInfo.videoDetails.isLiveContent,
          req: user
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        return res.status(500).json({ status: 500, error: error.message || error });
      }
    } else if (scdl.isValidUrl(song)) {
      try {
        songInfo = await scdl.getInfo(song);
        if (!songInfo) {
          return res.status(404).json({ status: 404 });
        }
        Song = {
          id: songInfo.permalink!,
          title: songInfo.title!,
          url: songInfo.permalink_url!,
          img: songInfo.artwork_url!,
          ago: moment(songInfo.last_modified!).fromNow(),
          views: millify(songInfo.playback_count!),
          duration: Math.ceil(songInfo.duration!),
          req: user
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        return res.status(500).json({ status: 500, error: error.message || error });
      }
    } else if (spdl.validateURL(song)) {
      try {
        songInfo = await spdl.getInfo(song);
        if (!songInfo) {
          return res.status(404).json({ status: 404 });
        }
        Song = {
          id: songInfo.id,
          title: songInfo.title,
          url: songInfo.url,
          img: songInfo.thumbnail,
          ago: '-',
          views: '-',
          duration: songInfo.duration!,
          req: user
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        return res.status(500).json({ status: 500, error: error.message || error });
      }
    } else {
      try {
        const searched = await yts.search(escapeRegExp(song));
        if (searched.videos.length === 0) {
          return res.status(404).json({ status: 404 });
        }
        songInfo = searched.videos[0];
        Song = {
          id: songInfo.videoId,
          title: Util.escapeMarkdown(songInfo.title),
          views: millify(songInfo.views),
          url: songInfo.url,
          ago: songInfo.ago,
          duration: songInfo.duration.seconds * 1000,
          img: songInfo.image,
          req: user
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        return res.json({ status: 500, error: error.message || error });
      }
    }
    if (serverQueue) {
      serverQueue.songs.push(Song);
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
      serverQueue.textChannel.send(embed);
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
          textChannel?.type === 'text' &&
          voiceChannel?.type === 'voice' &&
          textChannel.permissionsFor(guildMember)?.has('SEND_MESSAGES') &&
          voiceChannel.permissionsFor(guildMember)?.has('SPEAK')
        ) {
          const queueConstruct: IQueue = {
            textChannel: textChannel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 80,
            playing: true,
            loop: false
          };
          queueConstruct.songs.push(Song);
          (await import('../index')).queue.set(id, queueConstruct);
          try {
            const connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            const message = {
              guild: {
                id: id
              },
              channel: textChannel
            };
            play.play(queueConstruct.songs[0], message);
          } catch (error) {
            console.error(`${i18next.t('error.join')} ${error}`);
            (await import('../index')).queue.delete(id);
            voiceChannel.leave();
            return res.status(500).json({ status: i18next.t('error.join') });
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
    if (serverQueue && serverQueue.connection && serverQueue.connection.dispatcher) {
      try {
        if (serverQueue.playing) {
          serverQueue.connection.dispatcher.end();
          return res.json({ status: 'Skipped' });
        } else {
          serverQueue.playing = true;
          serverQueue.connection.dispatcher.resume();
          return res.json({ status: 'Resumed' });
        }
      } catch {
        serverQueue.voiceChannel.leave();
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
          channel.type == 'text' &&
          !!channel.permissionsFor(user) &&
          channel.permissionsFor(user)!.has('SEND_MESSAGES')
      )
      .array();
    const voiceChannels = channels
      ?.filter(
        (channel) =>
          channel.type == 'voice' &&
          !!channel.permissionsFor(user) &&
          channel.permissionsFor(user)!.has('SPEAK')
      )
      .array();
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
