import { Message, User } from 'discord.js';
import i18n from 'i18n';

import { config } from '../index';
i18n.setLocale(config.LOCALE);

export default class Util {
  static chunk(arr: string[], size: number): string[][] {
    const temp = [];
    for (let i = 0; i < arr.length; i += size) {
      temp.push(arr.slice(i, i + size));
    }
    return temp;
  }

  static get paginationEmojis(): string[] {
    return ['◀', '⛔', '▶'];
  }

  static async pagination(
    msg: Message,
    author: User,
    contents: string[] | string[][],
    init = true,
    currPage = 0
  ): Promise<void> {
    if (init) for (const emoji of this.paginationEmojis) await msg.react(emoji);

    const collector = msg.createReactionCollector(
      (reaction, user) => {
        return this.paginationEmojis.includes(reaction.emoji.name) && user.id === author.id;
      },
      {
        max: 1,
        time: 30000
      }
    );

    collector
      .on('collect', (reaction) => {
        reaction.users.remove(author);

        const emoji = reaction.emoji.name;
        if (emoji === this.paginationEmojis[0]) currPage--;
        if (emoji === this.paginationEmojis[1]) return collector.stop();
        if (emoji === this.paginationEmojis[2]) currPage++;
        currPage = ((currPage % contents.length) + contents.length) % contents.length;

        const embed = msg.embeds[0]
          .setDescription(contents[currPage])
          .setFooter(i18n.__mf('pagination', { page: currPage + 1, pages: contents.length }));

        msg.edit(embed);

        this.pagination(msg, author, contents, false, currPage);
      })
      .on('end', (_, reason) => {
        if (['time', 'user'].includes(reason)) msg.reactions.removeAll();
      });
  }
}
