declare module 'node-statsd' {
  export interface StatsDOptions {
    host?: string;
    port?: number;
    prefix?: string;
    suffix?: string;
    globalize?: boolean;
    cacheDns?: boolean;
    mock?: boolean;
    global_tags?: string[];
  }

  export default class StatsD {
    constructor(options?: StatsDOptions);
    constructor(host?: string, port?: number, prefix?: string, suffix?: string, globalize?: boolean, cacheDns?: boolean, mock?: boolean);

    increment(stat: string, value?: number, sampleRate?: number, tags?: string[], callback?: (error: Error | undefined, bytes: Buffer | undefined) => void): void;
    decrement(stat: string, value?: number, sampleRate?: number, tags?: string[], callback?: (error: Error | undefined, bytes: Buffer | undefined) => void): void;
    timing(stat: string, time: number, sampleRate?: number, tags?: string[], callback?: (error: Error | undefined, bytes: Buffer | undefined) => void): void;
    histogram(stat: string, value: number, sampleRate?: number, tags?: string[], callback?: (error: Error | undefined, bytes: Buffer | undefined) => void): void;
    gauge(stat: string, value: number, sampleRate?: number, tags?: string[], callback?: (error: Error | undefined, bytes: Buffer | undefined) => void): void;
    set(stat: string, value: number | string, sampleRate?: number, tags?: string[], callback?: (error: Error | undefined, bytes: Buffer | undefined) => void): void;
    unique(stat: string, value: number | string, sampleRate?: number, tags?: string[], callback?: (error: Error | undefined, bytes: Buffer | undefined) => void): void;

    close(callback?: (error: Error | undefined) => void): void;
  }
}