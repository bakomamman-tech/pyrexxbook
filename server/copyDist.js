const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "vite-project", "dist");
const dest = path.join(__dirname, "public", "dist");

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

fs.cpSync(src, dest, { recursive: true });

console.log("✅ Frontend dist copied to server/public/dist");
