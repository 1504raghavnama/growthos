import { Router, type IRouter } from "express";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

router.post("/track-photo-download", async (req, res) => {
  const { downloadLocation } = req.body;
  if (!downloadLocation || typeof downloadLocation !== "string") {
    res.status(400).json({ error: "downloadLocation required" });
    return;
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    res.status(200).json({ ok: true });
    return;
  }

  try {
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
    });
  } catch (err) {
    logger.warn({ err }, "Unsplash download tracking failed (non-fatal)");
  }

  res.status(200).json({ ok: true });
});

export default router;
