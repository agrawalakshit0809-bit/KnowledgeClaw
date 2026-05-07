import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [, , rawTarget, ...messageParts] = process.argv;
const message = messageParts.join(" ").trim();

function fail(error) {
  console.error(JSON.stringify({ ok: false, error: String(error?.message || error) }));
  process.exit(1);
}

function normalizeTarget(target) {
  const value = String(target || "").trim();
  if (!value) {
    throw new Error("WhatsApp target is missing");
  }
  if (value.includes("@")) {
    return value;
  }
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) {
    throw new Error("WhatsApp target must contain digits");
  }
  return `${digits}@s.whatsapp.net`;
}

const silentLogger = {
  level: "silent",
  child() {
    return silentLogger;
  },
  trace() {},
  debug() {},
  info() {},
  warn() {},
  error() {},
};

async function main() {
  if (!message) {
    throw new Error("WhatsApp message is missing");
  }

  const openclawNpmDir =
    process.env.OPENCLAW_NPM_DIR || path.join(os.homedir(), ".openclaw", "npm");
  const authDir =
    process.env.WHATSAPP_AUTH_DIR ||
    path.join(os.homedir(), ".openclaw", "credentials", "whatsapp", "default");
  const requireFromOpenClaw = createRequire(path.join(openclawNpmDir, "package.json"));
  const baileysPath = requireFromOpenClaw.resolve("@whiskeysockets/baileys");
  const baileys = await import(pathToFileURL(baileysPath).href);

  const makeWASocket = baileys.default || baileys.makeWASocket;
  const { fetchLatestBaileysVersion, useMultiFileAuthState } = baileys;
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const socket = makeWASocket({
    auth: state,
    browser: ["KnowledgeClaw", "Chrome", "1.0"],
    logger: silentLogger,
    markOnlineOnConnect: false,
    printQRInTerminal: false,
    version,
  });

  socket.ev.on("creds.update", saveCreds);

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("WhatsApp connect timeout")), 45000);
    socket.ev.on("connection.update", (update) => {
      if (update.connection === "open") {
        clearTimeout(timer);
        resolve();
      }
      if (update.connection === "close") {
        const message = update.lastDisconnect?.error?.message || "WhatsApp connection closed";
        reject(new Error(message));
      }
    });
  });

  const sent = await socket.sendMessage(normalizeTarget(rawTarget), { text: message });
  const messageId = sent?.key?.id || "unknown";
  await new Promise((resolve) => setTimeout(resolve, 500));
  try {
    socket.end(undefined);
  } catch {
    // Best effort cleanup; the message has already been handed to WhatsApp.
  }
  console.log(JSON.stringify({ ok: true, messageId }));
}

main().catch(fail);
