/**
 * One-time interactive login to create TELEGRAM_SESSION.
 *
 * Usage:
 *   TELEGRAM_API_ID=... TELEGRAM_API_HASH=... npm run login -w @underdog/helper
 *
 * Get api_id / api_hash at https://my.telegram.org
 */
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { TelegramClient } from "teleproto";
import { StringSession } from "teleproto/sessions/index.js";

const apiId = Number(process.env.TELEGRAM_API_ID || 0);
const apiHash = process.env.TELEGRAM_API_HASH || "";

if (!apiId || !apiHash) {
  console.error("Set TELEGRAM_API_ID and TELEGRAM_API_HASH first");
  process.exit(1);
}

const rl = createInterface({ input, output });
const session = new StringSession("");
const client = new TelegramClient(session, apiId, apiHash, {
  connectionRetries: 5,
});

await client.start({
  phoneNumber: async () => rl.question("Phone (+998...): "),
  password: async () => rl.question("2FA password (if any): "),
  phoneCode: async () => rl.question("Code from Telegram: "),
  onError: (error) => console.error(error),
});

const saved = client.session.save();
console.log("\nAuthorized. Put this into .env:\n");
console.log(`TELEGRAM_SESSION=${saved}`);
console.log("");

await client.disconnect();
rl.close();
