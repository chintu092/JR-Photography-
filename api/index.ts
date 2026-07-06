export default async (req: any, res: any) => {
  try {
    const serverModule = await import("../server");
    const app = await serverModule.appPromise;
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
