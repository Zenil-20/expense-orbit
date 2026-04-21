const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

function lanIps() {
  const out = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const iface of nets[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) out.push({ name, address: iface.address });
    }
  }
  return out;
}

const c = { cyan: "\x1b[36m", yellow: "\x1b[33m", dim: "\x1b[2m", bold: "\x1b[1m", reset: "\x1b[0m", magenta: "\x1b[35m", green: "\x1b[32m" };
const ips = lanIps();

console.log("");
console.log(`${c.bold}Expense Orbit — phone-ready dev server${c.reset}`);
console.log("─".repeat(56));
if (ips.length === 0) {
  console.log(`${c.yellow}No Wi-Fi / LAN interface detected.${c.reset}`);
  console.log(`Start Wi-Fi on the laptop, connect the phone to the same SSID, then re-run.`);
} else {
  console.log(`Open this on your phone (same Wi-Fi):`);
  for (const { name, address } of ips) {
    console.log(`  ${c.cyan}${c.bold}http://${address}:5173${c.reset}  ${c.dim}(${name})${c.reset}`);
  }
  console.log("");
  console.log(`Then: Share/Menu → ${c.bold}Add to Home Screen${c.reset} — it becomes a standalone app.`);
}
console.log("─".repeat(56));
console.log(`${c.dim}HMR: save any file and the phone reloads instantly.${c.reset}`);
console.log(`${c.dim}Stop: press Ctrl+C once.${c.reset}`);
console.log("");

const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

function run(cwd, tag, color) {
  const p = spawn(npm, ["run", "dev"], { cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"], shell: false });
  const prefix = `${color}[${tag}]${c.reset} `;
  const pipe = (src, dst) => src.on("data", (buf) => {
    for (const line of buf.toString().split(/\r?\n/)) if (line) dst.write(prefix + line + "\n");
  });
  pipe(p.stdout, process.stdout);
  pipe(p.stderr, process.stderr);
  p.on("close", (code) => console.log(prefix + `exited ${code}`));
  return p;
}

const api = run(root, "api", c.magenta);
const web = run(path.join(root, "client"), "web", c.cyan);

let shutting = false;
const shutdown = () => {
  if (shutting) return; shutting = true;
  api.kill("SIGINT"); web.kill("SIGINT");
  setTimeout(() => process.exit(0), 600);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
