const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const localtunnel = require("localtunnel");
const qr = require("qrcode-terminal");


const c = { cyan: "\x1b[36m", yellow: "\x1b[33m", dim: "\x1b[2m", bold: "\x1b[1m", reset: "\x1b[0m", magenta: "\x1b[35m", green: "\x1b[32m", red: "\x1b[31m" };
const root = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

function lanIps() {
  const out = [];
  for (const name of Object.keys(os.networkInterfaces())) {
    for (const iface of os.networkInterfaces()[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) out.push({ name, address: iface.address });
    }
  }
  return out;
}

function run(cwd, tag, color) {
  const p = spawn(npm, ["run", "dev"], { cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"], shell: isWin });
  const prefix = `${color}[${tag}]${c.reset} `;
  const pipe = (src, dst) => src.on("data", (buf) => {
    for (const line of buf.toString().split(/\r?\n/)) if (line) dst.write(prefix + line + "\n");
  });
  pipe(p.stdout, process.stdout);
  pipe(p.stderr, process.stderr);
  return p;
}

async function waitForVite(url, retries = 40) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok || r.status === 404) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  console.log("");
  console.log(`${c.bold}Expense Orbit — install as a real app on your phone${c.reset}`);
  console.log("─".repeat(62));

  const ips = lanIps();
  console.log(`${c.dim}LAN IPs detected:${c.reset}`);
  for (const { name, address } of ips) console.log(`  ${c.dim}· ${address}  (${name})${c.reset}`);
  console.log("");
  console.log(`Starting backend + web, then opening an HTTPS tunnel…`);
  console.log("");

  const api = run(root, "api", c.magenta);
  const web = run(path.join(root, "client"), "web", c.cyan);

  await waitForVite("http://127.0.0.1:5173");

  let tunnel;
  try {
    tunnel = await localtunnel({ port: 5173 });
  } catch (err) {
    console.log(`${c.red}Tunnel failed: ${err.message}${c.reset}`);
    console.log(`Falling back to LAN URL. Open http://${ips[0]?.address || "localhost"}:5173 on your phone.`);
    return;
  }

  const url = tunnel.url;
  console.log("");
  console.log("─".repeat(62));
  console.log(`${c.bold}${c.cyan}Open this on your phone and install the app:${c.reset}`);
  console.log(`${c.bold}${c.green}${url}${c.reset}`);
  console.log("");
  qr.generate(url, { small: true });
  console.log("");
  console.log(`${c.bold}Install on Android (Chrome):${c.reset}`);
  console.log(`  1. Open the URL above. On first visit, tap ${c.bold}Continue${c.reset} (loca.lt interstitial).`);
  console.log(`  2. Browser menu → ${c.bold}Install app${c.reset} (or "Add to Home screen").`);
  console.log(`  3. The app appears in your app drawer, launches standalone, no browser UI.`);
  console.log("");
  console.log(`${c.bold}Install on iOS (Safari):${c.reset}`);
  console.log(`  1. Open the URL above.`);
  console.log(`  2. Share → ${c.bold}Add to Home Screen${c.reset}.`);
  console.log("");
  console.log(`${c.dim}Edit any file — the installed app hot-reloads. Ctrl+C to stop.${c.reset}`);
  console.log("─".repeat(62));

  let shutting = false;
  const shutdown = async () => {
    if (shutting) return; shutting = true;
    try { await tunnel.close(); } catch {}
    api.kill("SIGINT"); web.kill("SIGINT");
    setTimeout(() => process.exit(0), 600);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  tunnel.on("close", () => console.log(`${c.yellow}Tunnel closed.${c.reset}`));
}

main().catch((err) => { console.error(err); process.exit(1); });
