export interface GuildInfo {
  owner: boolean;
  permissions: number;
  icon: string;
  id: string;
  name: string;
  hasPerms?: boolean;
  inGuild?: boolean;
}
