const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(process.argv[2] || "verification/goal-web"),
  port = Number(process.argv[3] || 8083);
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".json": "application/json",
  ".wav": "audio/wav",
};
http
  .createServer((req, res) => {
    const target = path.resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (!target.startsWith(root + path.sep) && target !== root) {
      res.writeHead(403);
      res.end();
      return;
    }
    const file = [
      target,
      target + ".html",
      path.join(target, "index.html"),
    ].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!file) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    const stream = fs.createReadStream(file);
    res.on("close", () => stream.destroy());
    stream.pipe(res);
  })
  .listen(port, "127.0.0.1", () =>
    console.log("Preview http://localhost:" + port),
  );
