# discordjs

See Original Source, there is a new Version with more features and a Web Interface3

I will split from the Original because I don't want Lavalink, Webinterface and other stuff

This will cause less updates because I am alone, feel free to open Pull Requests, Issues and Feature Requests

## 💻 First Start

Rename `.env.example` to `.env`  
Insert Token and a Prefix of your choice
Change Presence to your desire. This will be the "Activity" your bot is doing

## 🔗 Invite

```txt
https://discord.com/oauth2/authorize?client_id=<your_client_id>&permissions=3271744&scope=bot
```

Replace `your_client_id` with your client id from your Discord Application

## 🐳 Docker

Docker Images are available on the [Docker Hub](https://hub.docker.com/r/kaaaxcreators/discordjs)
When starting the container provide the Environment Variables

## <img src="https://caprover.com/img/logo-padded.png" width="32" height="32" align="left"> CapRover

Create New App without Persistent Data

Container HTTP Port: `8080`

In App Configs set Environment Variables

Deployment: Deploy via ImageName: `kaaaxcreators/discordjs`

## 💨 Run Projects

### Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/kaaaxcreators/discordjs)

### Replit

[![Run on Repl.it](https://repl.it/badge/github/kaaaxcreators/discordjs)](https://repl.it/github/kaaaxcreators/discordjs)

### Glitch

[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/import/github/kaaaxcreators/discordjs)

## 🌱 Environment Variables

- `TOKEN`: Discord Token
- `PREFIX`: Bot Prefix
- `SOUNDCLOUD_CLIENT_ID`: Soundcloud Client ID. Use: `2t9loNQH90kzJcsFCODdigxfp325aq4z`
- `PRESENCE`: Discord Presence Text

## 📝 Todo

- [ ] Discord Slash Commands (==discord.js@13)
- [ ] Spotify Support
- [ ] ?Permissions
- [ ] Convert to Typescript
