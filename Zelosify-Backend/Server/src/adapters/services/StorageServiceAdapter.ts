import { AwsStorageService } from "../../services/storage/aws/awsStorageService.js";
import { IStorageService } from "../../ports/services/IStorageService.js";
import { Readable } from "stream";

let storageInstance: IStorageService | null = null;

export function getStorageService(): IStorageService {
  if (!storageInstance) {
    storageInstance = new AwsStorageService();
  }
  return storageInstance;
}
