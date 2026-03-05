import type { Express } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

export function registerObjectStorageRoutes(app: Express): void {
  const service = new ObjectStorageService();

  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType } = req.body;
      if (!name) return res.status(400).json({ error: "Missing required field: name" });
      const uploadURL = await service.getObjectEntityUploadURL();
      const objectPath = service.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath, metadata: { name, size, contentType } });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const key = await service.getObjectEntityFile(req.path);
      await service.downloadObject(key, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) return res.status(404).json({ error: "Object not found" });
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}

