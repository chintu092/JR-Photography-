import { appPromise } from "../server.js";

export default async (req: any, res: any) => {
  try {
    const app = await appPromise;
    return app(req, res);
  } catch (err: any) {
    console.error("[Vercel Serverless Gateway] Error forwarding request:", err);
    res.status(500).json({ 
      error: "Failed to load Express gateway", 
      details: err.message,
      stack: err.stack
    });
  }
};
