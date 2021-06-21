export interface GuildInfo {
  owner: boolean;
  permissions: number;
  icon: string;
  id: string;
  name: string;
  /** User has MANAGE_GUILD Permission */
  hasPerms?: boolean;
  /** Bot is in Server */
  inGuild?: boolean;
}
