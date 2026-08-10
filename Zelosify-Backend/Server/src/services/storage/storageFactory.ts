import { AwsStorageService } from "./aws/awsStorageService.js";
import { StorageService } from "./storageService.js";

let storageServiceInstance: StorageService | null = null;

/**
 * Creates or returns the existing singleton storage service instance.
 * Tries AWS S3 first, falls back to MinIO if AWS fails.
 */
export const createStorageService = (): StorageService => {
  if (storageServiceInstance) {
    return storageServiceInstance;
  }

  const provider = process.env.STORAGE_PROVIDER || "aws";

  if (!provider) {
    throw new Error(
      "STORAGE_PROVIDER is not defined in the environment variables"
    );
  }

  switch (provider.toLowerCase()) {
    case "aws":
      try {
        // Try AWS S3 first
        storageServiceInstance = new AwsStorageService();
        console.log("[Storage] Using AWS S3 provider");
      } catch (error) {
        console.warn("[Storage] AWS S3 failed, falling back to MinIO:", (error as Error).message);
        // Fall back to MinIO
        storageServiceInstance = createMinioService();
      }
      break;

    case "minio":
      storageServiceInstance = createMinioService();
      break;

    default:
      throw new Error(`Unsupported storage provider: ${provider}`);
  }

  return storageServiceInstance;
};

/**
 * Creates a MinIO-compatible S3 service using MinIO credentials
 */
function createMinioService(): AwsStorageService {
  // Override S3 env vars with MinIO values
  process.env.S3_ENDPOINT = process.env.MINIO_ENDPOINT || "http://localhost:9100";
  process.env.S3_ACCESS_KEY_ID = process.env.MINIO_ACCESS_KEY || "minioadmin";
  process.env.S3_SECRET_ACCESS_KEY = process.env.MINIO_SECRET_KEY || "minioadmin";
  process.env.S3_BUCKET_NAME = process.env.MINIO_BUCKET || "zelosify-uploads";

  console.log("[Storage] Using MinIO provider");
  return new AwsStorageService();
}
