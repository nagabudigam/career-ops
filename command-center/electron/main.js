// Career-Ops Desktop — Electron main process.
//
// Boots the Next.js standalone server (using Electron's own bundled Node via
// ELECTRON_RUN_AS_NODE, so no separate Node install is required) and loads it
// in a window. In dev it simply attaches to `next dev` on port 4321.

const { app, BrowserWindow, dialog, Menu, shell } = require("electron");
const { spawn } = require("child_process");
const http = require("http");
const net = require("net");
const fs = require("fs");
const path = require("path");

const isDev = !app.isPackaged || process.env.ELECTRON_DEV === "1";
const DEV_URL = "http://localhost:4321";

let win = null;
let serverProc = null;
let serverPort = 0;
let currentRoot = "";
let appUrl = ""; // resolved URL to load; empty until startup completes
let startupDone = false;

/* ------------------------------- logging --------------------------------- */

function logLine(msg) {
  try {
    const p = path.join(app.getPath("userData"), "startup.log");
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.appendFileSync(p, `[${new Date().toISOString()}] ${msg}\n`);
  } catch {}
  console.log(msg);
}

process.on("uncaughtException", (e) => {
  logLine("uncaughtException: " + (e && e.stack ? e.stack : e));
});
process.on("unhandledRejection", (e) => {
  logLine("unhandledRejection: " + (e && e.stack ? e.stack : e));
});

/* ----------------------------- config storage ---------------------------- */

const cfgPath = () => path.join(app.getPath("userData"), "config.json");

function loadCfg() {
  try {
    return JSON.parse(fs.readFileSync(cfgPath(), "utf8"));
  } catch {
    return {};
  }
}

function saveCfg(cfg) {
  try {
    fs.mkdirSync(path.dirname(cfgPath()), { recursive: true });
    fs.writeFileSync(cfgPath(), JSON.stringify(cfg, null, 2));
  } catch (e) {
    console.error("Could not save config:", e);
  }
}

/* ------------------------------- root logic ------------------------------ */

function isCareerOpsRoot(dir) {
  if (!dir) return false;
  try {
    return (
      fs.existsSync(path.join(dir, "modes")) &&
      (fs.existsSync(path.join(dir, "data")) || fs.existsSync(path.join(dir, "cv.md")))
    );
  } catch {
    return false;
  }
}

// In a dev checkout, electron/ lives at <repo>/command-center/electron → repo is two up.
function detectDefaultRoot() {
  const guess = path.resolve(__dirname, "..", "..");
  return isCareerOpsRoot(guess) ? guess : "";
}

async function promptForRoot() {
  const res = await dialog.showOpenDialog({
    title: "Select your career-ops folder",
    message: "Choose the career-ops repository folder (contains cv.md, modes/, data/).",
    properties: ["openDirectory"],
    buttonLabel: "Use this folder",
  });
  if (res.canceled || !res.filePaths[0]) return "";
  const dir = res.filePaths[0];
  if (!isCareerOpsRoot(dir)) {
    await dialog.showMessageBox({
      type: "error",
      message: "That doesn't look like a career-ops folder",
      detail: "Expected to find modes/ and data/ (or cv.md). Please pick the repository root.",
    });
    return promptForRoot();
  }
  return dir;
}

async function ensureRoot() {
  const cfg = loadCfg();
  if (isCareerOpsRoot(cfg.root)) return cfg.root;
  const auto = detectDefaultRoot();
  if (auto) {
    saveCfg({ ...cfg, root: auto });
    return auto;
  }
  const picked = await promptForRoot();
  if (picked) saveCfg({ ...loadCfg(), root: picked });
  return picked;
}

/* ------------------------------- env file -------------------------------- */

// Minimal KEY=VALUE parser for <root>/web/.env.local (IMAP creds, OLLAMA_HOST).
function parseEnvFile(file) {
  const out = {};
  try {
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
      if (!m) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      out[m[1]] = v;
    }
  } catch {
    /* no env file */
  }
  return out;
}

/* ------------------------------ server boot ------------------------------ */

function freePort() {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, "127.0.0.1", () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
}

function waitForServer(port, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const req = http.get({ host: "127.0.0.1", port, path: "/" }, (res) => {
        res.destroy();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) reject(new Error("Server did not start in time"));
        else setTimeout(tick, 300);
      });
    };
    tick();
  });
}

async function startServer(root) {
  serverPort = await freePort();
  const serverDir = app.isPackaged
    ? path.join(process.resourcesPath, "standalone")
    : path.join(__dirname, "..", ".next", "standalone");
  const serverJs = path.join(serverDir, "server.js");
  if (!fs.existsSync(serverJs)) {
    throw new Error(`Standalone server not found at ${serverJs}. Run "npm run desktop:build" first.`);
  }

  const envFile = parseEnvFile(path.join(root, "command-center", ".env.local"));
  const env = {
    ...process.env,
    ...envFile,
    NODE_ENV: "production",
    PORT: String(serverPort),
    HOSTNAME: "127.0.0.1",
    CAREER_OPS_ROOT: root,
    CAREER_OPS_NODE: process.execPath,
    CAREER_OPS_ELECTRON: "1",
    ELECTRON_RUN_AS_NODE: "1",
    OLLAMA_HOST: envFile.OLLAMA_HOST || process.env.OLLAMA_HOST || "http://localhost:11434",
  };

  serverProc = spawn(process.execPath, [serverJs], { cwd: serverDir, env, stdio: "inherit" });
  serverProc.on("exit", () => {
    serverProc = null;
  });

  await waitForServer(serverPort);
  return `http://127.0.0.1:${serverPort}`;
}

function stopServer() {
  if (serverProc) {
    try {
      serverProc.kill();
    } catch {}
    serverProc = null;
  }
}

/* -------------------------------- window --------------------------------- */

// Only ever creates a window once `appUrl` is known (never with a 0 port).
function createWindow() {
  if (!appUrl) {
    logLine("createWindow skipped: appUrl not ready yet");
    return;
  }
  if (win) {
    win.focus();
    return;
  }
  win = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 920,
    minHeight: 600,
    backgroundColor: "#0a0b0f",
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  win.once("ready-to-show", () => win.show());
  win.loadURL(appUrl);
  win.on("closed", () => {
    win = null;
  });
}

async function reloadWithRoot(root) {
  saveCfg({ ...loadCfg(), root });
  currentRoot = root;
  if (isDev) {
    appUrl = DEV_URL;
  } else {
    stopServer();
    appUrl = await startServer(root);
  }
  if (win) win.loadURL(appUrl);
  else createWindow();
}

/* --------------------------------- menu ---------------------------------- */

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "File",
      submenu: [
        {
          label: "Choose Career-Ops Folder…",
          click: async () => {
            const picked = await promptForRoot();
            if (picked) await reloadWithRoot(picked);
          },
        },
        {
          label: "Open Data Folder",
          click: () => {
            if (currentRoot) shell.openPath(path.join(currentRoot, "data"));
          },
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { label: "Reload App", accelerator: "CmdOrCtrl+R", click: () => win && win.reload() },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        {
          label: "career-ops on GitHub",
          click: () => shell.openExternal("https://github.com/santifer/career-ops"),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/* ------------------------------- lifecycle ------------------------------- */

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    buildMenu();
    try {
      const root = await ensureRoot();
      if (!root) {
        dialog.showErrorBox(
          "Setup needed",
          "No career-ops folder was selected. Re-launch Career-Ops and pick your career-ops repository folder to continue."
        );
        app.quit();
        return;
      }
      currentRoot = root;
      logLine("starting with root=" + root + " isDev=" + isDev);
      appUrl = isDev ? DEV_URL : await startServer(root);
      startupDone = true;
      logLine("server ready at " + appUrl);
      createWindow();
    } catch (e) {
      logLine("startup failed: " + (e && e.stack ? e.stack : e));
      dialog.showErrorBox(
        "Could not start Career-Ops",
        String(e && e.message ? e.message : e) +
          "\n\nSee startup.log in the app's data folder for details."
      );
      app.quit();
    }
  });

  // Only recreate a window after startup finished — never with a 0 port.
  app.on("activate", () => {
    if (startupDone && !win) createWindow();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("before-quit", stopServer);
}
