import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  entersState,
  StreamType,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus
} from '@discordjs/voice';
import { StageChannel, TextBasedChannel, User, Util, VoiceChannel } from 'discord.js';
import ytdlDiscord from 'discord-ytdl-core';
import i18next from 'i18next';
import millify from 'millify';
import moment from 'moment';
import scdl from 'soundcloud-downloader/dist/index';
import spdl from 'spdl-core';
import { promisify } from 'util';
import yts from 'yt-search';
import ytdl from 'ytdl-core';

const wait = promisify(setTimeout);

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

/**
 * A MusicSubscription exists for each active VoiceConnection. Each subscription has its own audio player and queue,
 * and it also attaches logic to the audio player and voice connection for error handling and reconnection logic.
 */
export class MusicSubscription {
  public readonly voiceConnection: VoiceConnection;
  public readonly voiceChannel: VoiceChannel | StageChannel;
  public readonly textChannel: TextBasedChannel;
  public readonly audioPlayer: AudioPlayer;
  public queue: Track[];
  public volume = 80;
  /** If Song Loop is turned on */
  public loop = false;
  /** If Music is paused */
  public paused = false;
  /** If Queue is being edited */
  public queueLock = false;
  /** If currently waiting to be Ready */
  public readyLock = false;
  public currentResource: null | AudioResource<Track> = null;

  public constructor(
    voiceConnection: VoiceConnection,
    voiceChannel: VoiceChannel | StageChannel,
    textChannel: TextBasedChannel
  ) {
    this.voiceConnection = voiceConnection;
    this.voiceChannel = voiceChannel;
    this.textChannel = textChannel;
    this.audioPlayer = createAudioPlayer();
    this.queue = [];

    this.voiceConnection.on<'stateChange'>('stateChange', async (_, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        if (
          newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
          newState.closeCode === 4014
        ) {
          /*
						If the WebSocket closed with a 4014 code, this means that we should not manually attempt to reconnect,
						but there is a chance the connection will recover itself if the reason of the disconnect was due to
						switching voice channels. This is also the same code for the bot being kicked from the voice channel,
						so we allow 5 seconds to figure out which scenario it is. If the bot has been kicked, we should destroy
						the voice connection.
					*/
          try {
            await entersState(this.voiceConnection, VoiceConnectionStatus.Connecting, 5_000);
            // Probably moved voice channel
          } catch {
            this.voiceConnection.destroy();
            // Probably removed from voice channel
          }
        } else if (this.voiceConnection.rejoinAttempts < 5) {
          /*
						The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
					*/
          await wait((this.voiceConnection.rejoinAttempts + 1) * 5_000);
          this.voiceConnection.rejoin();
        } else {
          /*
						The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
					*/
          this.voiceConnection.destroy();
        }
      } else if (newState.status === VoiceConnectionStatus.Destroyed) {
        /*
					Once destroyed, stop the subscription
				*/
        this.stop();
      } else if (
        !this.readyLock &&
        (newState.status === VoiceConnectionStatus.Connecting ||
          newState.status === VoiceConnectionStatus.Signalling)
      ) {
        /*
					In the Signalling or Connecting states, we set a 10 second time limit for the connection to become ready
					before destroying the voice connection. This stops the voice connection permanently existing in one of these
					states.
				*/
        this.readyLock = true;
        try {
          await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 10e3);
        } catch {
          if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
            this.voiceConnection.destroy();
          }
        } finally {
          this.readyLock = false;
        }
      }
    });

    // Configure audio player
    this.audioPlayer.on<'stateChange'>('stateChange', (oldState, newState) => {
      if (
        newState.status === AudioPlayerStatus.Idle &&
        oldState.status !== AudioPlayerStatus.Idle
      ) {
        // If the Idle state is entered from a non-Idle state, it means that an audio resource has finished playing.
        // The queue is then processed to start playing the next track, if one is available.

        // Remove Item from Queue when done playing
        this.currentResource = null;
        const nextTrack = this.queue.shift();
        if (this.loop && nextTrack) {
          this.queue.push(nextTrack);
        }
        (oldState.resource as AudioResource<Track>).metadata.onFinish();
        void this.processQueue();
      } else if (newState.status === AudioPlayerStatus.Playing) {
        // If the Playing state has been entered, then a new track has started playback.
        (newState.resource as AudioResource<Track>).metadata.onStart(
          (newState.resource as AudioResource<Track>).metadata
        );
      }
    });

    this.audioPlayer.on('error', (error) =>
      (error.resource as AudioResource<Track>).metadata.onError(error)
    );

    voiceConnection.subscribe(this.audioPlayer);
  }

  /**
   * Adds a new Track to the queue.
   *
   * @param track The track to add to the queue
   */
  public enqueue(track: Track): void {
    this.queue.push(track);
    void this.processQueue();
  }

  /**
   * Stops audio playback and empties the queue
   */
  public stop(): void {
    if (this.queueLock) {
      return;
    }
    this.queueLock = true;
    this.queue = [];
    this.audioPlayer.stop(true);
    this.queueLock = false;
  }

  public pause(): void {
    if (this.queueLock) {
      return;
    }
    if (this.paused) {
      return;
    }
    this.paused = true;
    this.audioPlayer.pause();
  }

  public setVolume(volume: number): void {
    if (this.queueLock) {
      return;
    }
    this.volume = volume;
    this.currentResource?.volume?.setVolumeLogarithmic(volume / 100);
  }

  public resume(): void {
    if (this.queueLock) {
      return;
    }
    if (!this.paused) {
      return;
    }
    this.paused = false;
    this.audioPlayer.unpause();
  }

  public skip(): void {
    if (this.queueLock) {
      return;
    }
    if (this.paused) {
      this.resume();
    }
    this.audioPlayer.stop(true);
  }

  public skipTo(): void {
    if (this.queueLock) {
      return;
    }
    if (this.paused) {
      this.resume();
    }
    this.audioPlayer.stop(true);
  }

  /**
   * Attempts to play a Track from the queue
   */
  private async processQueue(): Promise<void> {
    // If the queue is locked (already being processed), is empty, or the audio player is already playing something, return
    if (
      this.queueLock ||
      this.audioPlayer.state.status !== AudioPlayerStatus.Idle ||
      this.queue.length === 0
    ) {
      return;
    }
    // Lock the queue to guarantee safe access
    this.queueLock = true;

    // Take the first item from the queue. This is guaranteed to exist due to the non-empty check above.
    const nextTrack = this.queue[0];
    try {
      // Attempt to convert the Track into an AudioResource (i.e. start streaming the video)
      const resource = await nextTrack.createAudioResource();
      resource.volume?.setVolumeLogarithmic(this.volume / 100);
      this.currentResource = resource;
      this.audioPlayer.play(resource);
      this.queueLock = false;
    } catch (error) {
      // If an error occurred, try the next item of the queue instead
      nextTrack.onError(error as Error);
      this.queueLock = false;
      return this.processQueue();
    }
  }
}

/**
 * This is the data required to create a Track object
 */
export interface TrackData {
  id: string;
  url: string;
  title: string;
  views: string;
  ago: string;
  /** Duration in ms */
  duration: number;
  img: string;
  live?: boolean;
  req: User;
  onStart: (info: Omit<TrackData, 'onStart' | 'onFinish' | 'onError'>) => void;
  onFinish: () => void;
  onError: (error: Error) => void;
}

export class Track implements TrackData {
  public readonly id: string;
  public readonly url: string;
  public readonly title: string;
  public readonly views: string;
  public readonly ago: string;
  public readonly duration: number;
  public readonly img: string;
  public readonly live: boolean;
  public readonly req: User;
  public readonly onStart: (info: Omit<TrackData, 'onStart' | 'onFinish' | 'onError'>) => void;
  public readonly onFinish: () => void;
  public readonly onError: (error: Error) => void;

  public constructor({
    id,
    url,
    title,
    views,
    ago,
    duration,
    img,
    live = false,
    req,
    onStart,
    onFinish,
    onError
  }: TrackData) {
    this.id = id;
    this.url = url;
    this.title = title;
    this.views = views;
    this.ago = ago;
    this.duration = duration;
    this.img = img;
    this.live = live;
    this.req = req;
    this.onStart = onStart;
    this.onFinish = onFinish;
    this.onError = onError;
  }

  /**
   * Creates an AudioResource from this Track.
   */
  public async createAudioResource(): Promise<AudioResource<Track>> {
    let stream;
    let streamType: StreamType;
    if (this.url.includes('soundcloud.com')) {
      try {
        stream = await scdl.downloadFormat(this.url, scdl.FORMATS.OPUS);
        streamType = StreamType.OggOpus;
      } catch (error) {
        stream = await scdl.downloadFormat(this.url, scdl.FORMATS.MP3);
        streamType = StreamType.Arbitrary;
      }
    } else if (this.url.includes('youtube.com')) {
      // Don't filter audioonly when live
      if (this.live) {
        stream = ytdlDiscord(this.url, {
          quality: 'highestaudio',
          highWaterMark: 1 << 25,
          opusEncoded: true
        });
      } else {
        stream = ytdlDiscord(this.url, {
          filter: 'audioonly',
          quality: 'highestaudio',
          highWaterMark: 1 << 25,
          opusEncoded: true
        });
      }
      streamType = StreamType.Opus;
    } else if (this.url.includes('spotify.com')) {
      stream = await spdl(this.url, {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25,
        opusEncoded: true
      });
      streamType = StreamType.Opus;
    } else if (this.id == 'radio') {
      stream = this.url;
      streamType = StreamType.Arbitrary;
    } else {
      throw new Error('Unsupported URL');
    }
    return createAudioResource(stream, {
      metadata: this,
      inputType: streamType,
      inlineVolume: true
    });
  }

  /**
   * Creates a Track from a video URL and lifecycle callback methods.
   *
   * @param url The URL of the video
   * @param methods Lifecycle callbacks
   * @returns The created Track
   */
  public static async from(
    args: string[],
    message: { author: User },
    methods: Pick<Track, 'onStart' | 'onFinish' | 'onError'>
  ): Promise<Track> {
    let info: Omit<TrackData, 'onStart' | 'onFinish' | 'onError'>;
    const url = args[0] ? args[0].replace(/<(.+)>/g, '$1') : '';
    const searchString = args.join(' ');
    if (
      url.match(
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i
      )
    ) {
      // youtube video
      const ytdlInfo = await ytdl.getInfo(url);
      if (!ytdlInfo) {
        throw new Error(i18next.t('play.notfound.youtube'));
      }
      info = {
        id: ytdlInfo.videoDetails.videoId,
        title: ytdlInfo.videoDetails.title,
        url: ytdlInfo.videoDetails.video_url,
        img: ytdlInfo.player_response.videoDetails.thumbnail.thumbnails[0].url,
        duration: Number(ytdlInfo.videoDetails.lengthSeconds) * 1000,
        ago: moment(ytdlInfo.videoDetails.publishDate).fromNow(),
        views: millify(Number(ytdlInfo.videoDetails.viewCount)),
        live: ytdlInfo.videoDetails.isLiveContent,
        req: message.author
      };
      // TODO: implement soundcloud with soundcloud.ts
      // eslint-disable-next-line no-constant-condition
    } else if (scdl.isValidUrl(url)) {
      // soundcloud song
      const scdlInfo = await scdl.getInfo(url);
      if (!scdlInfo) {
        throw new Error(i18next.t('play.notfound.soundcloud'));
      }
      info = {
        id: scdlInfo.permalink!,
        title: scdlInfo.title!,
        url: scdlInfo.permalink_url!,
        img: scdlInfo.artwork_url!,
        ago: moment(scdlInfo.last_modified!).fromNow(),
        views: millify(scdlInfo.playback_count!),
        duration: Math.ceil(scdlInfo.duration!),
        req: message.author
      };
    } else {
      const ytsResult = await yts.search(searchString);
      if (ytsResult.videos.length === 0) {
        throw new Error(i18next.t('play.notfound.youtube'));
      }
      const ytsInfo = ytsResult.videos[0];
      info = {
        id: ytsInfo.videoId,
        title: Util.escapeMarkdown(ytsInfo.title),
        views: millify(ytsInfo.views),
        url: ytsInfo.url,
        ago: ytsInfo.ago,
        duration: ytsInfo.duration.seconds * 1000,
        img: ytsInfo.image,
        req: message.author
      };
    }

    // The methods are wrapped so that we can ensure that they are only called once.
    const wrappedMethods = {
      onStart() {
        wrappedMethods.onStart = noop;
        methods.onStart(info);
      },
      onFinish() {
        wrappedMethods.onFinish = noop;
        methods.onFinish();
      },
      onError(error: Error) {
        wrappedMethods.onError = noop;
        methods.onError(error);
      }
    };

    return new Track({
      ...info,
      ...wrappedMethods
    });
  }
}
