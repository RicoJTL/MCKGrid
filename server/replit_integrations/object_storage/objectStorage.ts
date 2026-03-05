import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Response } from "express";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME ?? "mckgrid-uploads";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export const objectStorageClient = s3;

export class ObjectStorageService {
  async getObjectEntityUploadURL(): Promise<string> {
    const key = `uploads/${randomUUID()}`;
    const command = new PutObjectCommand({ Bucket: BUCKET, Key: key });
    const url = await getSignedUrl(s3, command, { expiresIn: 900 });
    return url;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (rawPath.startsWith("https://") && rawPath.includes(".r2.cloudflarestorage.com")) {
      const url = new URL(rawPath);
      return `/objects${url.pathname.replace(`/${BUCKET}`, "")}`;
    }
    return rawPath;
  }

  async getObjectEntityFile(objectPath: string): Promise<string> {
    if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
    const key = objectPath.replace("/objects/", "");
    try {
      await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
      return key;
    } catch {
      throw new ObjectNotFoundError();
    }
  }

  async downloadObject(key: string, res: Response) {
    try {
      const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
      const result = await s3.send(command);
      res.set({
        "Content-Type": result.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      });
      (result.Body as any).pipe(res);
    } catch {
      if (!res.headersSent) res.status(500).json({ error: "Error downloading file" });
    }
  }

  async trySetObjectEntityAclPolicy(rawPath: string, _aclPolicy: any): Promise<string> {
    return this.normalizeObjectEntityPath(rawPath);
  }

  async canAccessObjectEntity(_opts: any): Promise<boolean> {
    return true;
  }
}

