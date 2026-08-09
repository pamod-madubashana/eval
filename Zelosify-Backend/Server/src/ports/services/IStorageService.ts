import { Readable } from "stream";

export interface IStorageService {
  getObjectURL(key: string): Promise<string>;
  getObjectStream(key: string): Promise<Readable>;
  putObject(key: string, file: Buffer | Uint8Array | Blob | string, contentType?: string): Promise<{ message: string }>;
  listObjects(prefix: string): Promise<any[]>;
  getUploadURL(key: string): Promise<string>;
}
