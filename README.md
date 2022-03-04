# 🤖 Typescript Discord Music Bot

[![wakatime](https://wakatime.com/badge/github/kaaaxcreators/Discord-MusicBot.svg)](https://wakatime.com/badge/github/kaaaxcreators/Discord-MusicBot)
[![Gitmoji](https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=flat-square)](https://gitmoji.dev)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Typescript](https://img.shields.io/badge/TypeScript-strict%20%F0%9F%92%AA-blue)](https://www.typescriptlang.org/)
[![GitHub](https://img.shields.io/github/license/kaaaxcreators/Discord-MusicBot)](https://github.com/kaaaxcreators/Discord-MusicBot/blob/main/LICENSE)
[![Release CI](https://github.com/kaaaxcreators/Discord-MusicBot/actions/workflows/release.yml/badge.svg)](https://github.com/kaaaxcreators/Discord-MusicBot/actions/workflows/release.yml)

## 💻 First Start

Rename `.env.example` to `.env`  
Insert Token and a Prefix of your choice
Change Presence to your desire. This will be the "Activity" your bot is doing

## 🔗 Invite

```txt
https://discord.com/oauth2/authorize?client_id=<your_client_id>&permissions=2205280320&scope=applications.commands%20bot
```

Replace `your_client_id` with your client id from your Discord Application

## <img src="https://emoji.gg/assets/emoji/SpotifyLogo.png" width="32" height="32" align="left"> Spotify

Spotify Tracks and Playlists are supported

But it really just tries to find the Spotify Song on Youtube

A Track has to be in this format: `https://open.spotify.com/track/<anything>`

A Playlist has to be in this format: `https://open.spotify.com/playlist/<anything>`

## 🌱 Environment Variables

### Required

- `TOKEN`: Discord Bot Token
- `PREFIX`: Bot Prefix
- `PRESENCE`: Discord Presence/Activity Text
- `SECRET`: Discord Client Secret
- `WEB`: Hosting Website including Protocol

### Optional

- `LOCALE`: Language ([ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)).
Available Languages are `de`, `en`. Defaults to `en`
- `LOG`: Log Filename. Defaults to `logs.log`
- `PERMS`: Discord Permission Integer. Defaults to `2184301632`
- `SCOPES`: Discord OAuth2 Scopes separated with a space. Defaults to `identify guilds applications.commands`
- `CALLBACK`: Discord OAuth2 Callback URL. Defaults to `/api/callback`
- `LIVERELOAD`: Enable Livereload. Set to `true` to enable it. (needs browser extension),
- `DISABLE_WEB`: Check [here](#-disabling-dashboard)
- `DIDYOUMEAN`: Check [here](#-didyoumean)
- `GUILDPREFIX`: Check [here](#-guild-prefix)
- `GUILDACTIONS`: Check [here](#-guild-actions)
- `UPDATEDIFF`: How often Data should be updated in minutes. Defaults to `5`
- `SLASHCOMMANDS`: If Bot should add Slash Commands to all Servers. Defaults to `true`

## 📑 Commands

A List of all available commands is available [here](COMMANDS.md)

## 💨 Run Project

### 🐳 Docker

Docker Images are available on the [Docker Hub](https://hub.docker.com/r/kaaaxcreators/discord-musicbot)

When starting the container provide the [Environment Variables](#-environment-variables)

Setup a Docker Volume at `/usr/src/app/db`

### <img src="https://caprover.com/img/logo-padded.png" width="32" height="32" align="left"> CapRover

Create New App with Persistent Data

Container HTTP Port: `8080`

In App Configs set [Environment Variables](#-environment-variables) and a Persistent Directory with the Path in App being `/usr/src/app/db` and the Label anything you want

Deployment: Deploy via ImageName: `kaaaxcreators/discord-musicbot`

### Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/kaaaxcreators/Discord-MusicBot)

App name: Any name you want

Region: Region closest to you

Config Vars: Enter your Variables

Click: Deploy app

💤24/7: Keep Heroku app awake with [Kaffeine](https://kaffeine.herokuapp.com/)

### Replit

[![Run on Repl.it](https://repl.it/badge/github/kaaaxcreators/Discord-MusicBot)](https://repl.it/github/kaaaxcreators/Discord-MusicBot)

On the Sidebar click on the Lock ("Secrets (Environment Variables)")

Enter [Environment Variables](#-environment-variables)

Click on "Run ▶️"

Wait until "[API] Logged in as `<your_bot_name>`"

💤24/7: Keep Repl awake with [UptimeRobot](https://uptimerobot.com/), [HetrixTools](https://hetrixtools.com/), [Cronnomy](https://cronnomy.com/) or [cron-job.org](https://cron-job.org/)

### Glitch

[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/import/github/kaaaxcreators/Discord-MusicBot)

Delete `.env`

Rename `.env.example` to `.env`

Enter [Environment Variables](#-environment-variables)

💤24/7: [Glitch doesn't support 24/7 in Free Plans](https://support.glitch.com/t/ping-service-block-june-13-7-56-a-m-to-present/26443)

### Directly

Install NodeJS v14.0.0 or higher

Run `npm i` to install required packages

Run `npm run deploy` to compile and start the Bot

#### System Requirements

You'll need 1 Core and 200MB of RAM to run this Bot on multiple servers

Connected to 2 VC playing music draws 100MB of RAM and 25% CPU (3,3 GHz)
With Dashboard enabled it uses 150MB of RAM and 30% CPU (3,3 GHz)

## 🌐 Localization

You can add and contribute to Languages [here](https://poeditor.com/join/project?hash=vC5ESOmMLK)

## 📁 Log

Example

```log
[2021-05-28 16:05:28] info "dist\index.js:95:26" "Laden des Musikbefehls: earrape",
```

| Meaning | Value in Example                  | Description                          |
|---------|-----------------------------------|--------------------------------------|
| When    | [2021-05-28 16:05:28]             | Time in Format `YYYY-MM-DD HH:MM:SS` |
| Type    | info                              | Log Level / Reason                   |
| Where   | "dist\index.js:95:26"             | Where the Log is comming from        |
| What    | "Laden des Musikbefehls: earrape" | What was logged                      |

## ❌ Disabling Dashboard

Disable the Express Server and with it the Dashboard

Add Environment Variable `DISABLE_WEB` with content `true`

You still have to set all [Required Environment  Variables](#required) but they can be empty

## ⬆️ Migration

See [MIGRATE](MIGRATE.md) for more infos

## 🤔 didyoumean

responds to u if you mistype a command with the nearest possible solution.

Enable it by setting a Env Var `DIDYOUMEAN` with content/value `true`

Uses [didyoumean2](https://www.npmjs.com/package/didyoumean2)

## <img src="https://static.thenounproject.com/png/644559-200.png" width="32" height="32" align="left"> Guild Prefix

Be able to change Prefixes on per Guild basis

Enable it by setting a Env Var `GUILDPREFIX` with content/value `true`

## <img src="https://static.thenounproject.com/png/333746-200.png" width="32" height="32" align="left"> Guild Actions

Allow Users to change Settings in the Dashboard (Prefix, Queue, ...)

Enable it by setting a Env Var `GUILDACTIONS` with content/value `true`

🔒 Security Warning: This feature is not fully secure! If somebody gets demoted/removed/etc they can still use dashboard actions for up to 5 minutes

## ©️ Credits

This Bot / Repo is not a fork but heavily inspired from [SudhanPlayz/Discord-MusicBot](https://github.com/SudhanPlayz/Discord-MusicBot).
I didn't like the move to Lavalink which adds an unnecessary dependency, because you need a server which hosts Lavalink and not everyone wants to. Through my approach that the client handles all music, it sometimes hangs or lags shortly but not really noticeable

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
