# Migration Guide

## Migrate from v1.x.x to v2.x.x

Breaking Changes: required Environment Variables: `SECRET` and `WEB`

### Easiest Migration

Set `SECRET` and `WEB` to `""`

Set `DISABLE_WEB` to `true`

Disclaimer: This ignores all new Features why are primarily the Dashboard and the API

### Best Migration

Set `SECRET` to your Discord OAuth2 Client Secret

Set `WEB` to the Website the Bot is hosted (all lowercase!). Example: `https://discord-musicbot.cooluser.repl.co`

This enabled the Dashboard and API which is available by default on `localhost:8080` or your URL (from e.g. Replit)
