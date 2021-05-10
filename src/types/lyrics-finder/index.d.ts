declare module 'lyrics-finder' {
  function s(url, d = ''): Promise<string[]>;
  export = s;
}
