import fs from 'fs';
import { dirname as PathDirname } from 'path';
import { fileURLToPath } from 'url';

import { Command, config } from './index';

const __dirname = PathDirname(fileURLToPath(import.meta.url));

const commands = new Map<string, Command>();
/**
 * Synchronous Doc Generation
 */
export default function docs(): void {
  console.log('Creating Docs');
  //Loading Music
  const music = fs.readdirSync(__dirname + '/commands/music');
  music.forEach((file) => {
    if (!file.endsWith('.js')) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const props = require(__dirname + `/commands/music/${file}`);
    const commandName = file.split('.')[0];
    commands.set(commandName, props);
    console.log('Loading Music Command: ' + commandName);
  });

  //Loading General
  const general = fs.readdirSync(__dirname + '/commands/general');
  general.forEach((file) => {
    if (!file.endsWith('.js')) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const props = require(__dirname + `/commands/general/${file}`);
    const commandName = file.split('.')[0];
    commands.set(commandName, props);
    console.log('Loading General Command: ' + commandName);
  });

  let generalcmds = '';
  let musiccmds = '';

  // Looping through
  // copied from help command
  commands.forEach((cmd) => {
    const cmdinfo = cmd.info;
    // Remove unnecessary space
    const usage = cmdinfo.usage ? ' ' + cmdinfo.usage : '';
    switch (cmdinfo.categorie) {
      case 'general':
        generalcmds +=
          '`' +
          config.prefix +
          cmdinfo.name +
          usage +
          '` ~ ' +
          cmdinfo.description +
          (cmdinfo.hidden ? ' - **hidden**' : '') +
          '\n\n';
        break;
      case 'music':
        musiccmds +=
          '`' +
          config.prefix +
          cmdinfo.name +
          usage +
          '` ~ ' +
          cmdinfo.description +
          (cmdinfo.hidden ? ' - **hidden**' : '') +
          '\n\n';
        break;
      default:
        break;
    }
  });
  const data = `# :robot: Typescript Discord Music Bot
  
## Commands

### :information_source: General

${generalcmds.trim()}

### :notes: Music

${musiccmds.trim()}
`;

  fs.writeFileSync(__dirname + '/../COMMANDS.md', data);
  console.log('Saved File');
  process.exit();
}
