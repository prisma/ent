interface Data {
  data: any;
  [x: string]: any;
}
export interface ICache<T extends Data = Data, U extends Data = Data> {
  read(id: string): T | undefined;
  write(id: string, data: U, opts?: Record<string, any>): T | undefined;
  remove?(id: string): T | undefined;
}
