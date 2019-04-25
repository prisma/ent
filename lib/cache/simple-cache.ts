import { ICache } from "./cache";

interface SimpleWriteInput {
  data: Record<string, any>;
}

interface SimpleCacheEntry {
  data: SimpleWriteInput["data"];
  expires: number;
}

export class SimpleCache implements ICache<SimpleWriteInput> {
  constructor(
    protected ttl: number = 1000,
    protected cache: Record<string, SimpleCacheEntry> = {}
  ) {}

  read(id: string) {
    let data = this.cache[id];

    if (data && this.now() > data.expires) {
      delete this.cache[id];

      return undefined;
    }

    return data;
  }

  write(id: string, input: SimpleWriteInput, opts?: { ttl?: number }) {
    if (!opts) {
      opts = {};
    }
    if (!opts.ttl) {
      opts.ttl = this.ttl;
    }
    const previous = this.read(id);

    this.cache[id] = { ...input, expires: this.now() + opts.ttl };

    return previous;
  }

  remove(id: string) {
    const previous = this.read(id);

    delete this.cache[id];

    return previous;
  }

  private now() {
    return new Date().getTime();
  }
}
