import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import input from 'input';
import dotenv from 'dotenv';

dotenv.config();

const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;

if (!apiId || !apiHash) {
    console.error("❌ Error: Please define TELEGRAM_API_ID and TELEGRAM_API_HASH inside your .env file first.");
    process.exit(1);
}

(async () => {
    console.log("Initializing Token Generator Engine...");
    const stringSession = new StringSession("");
    const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });

    try {
        await client.start({
            phoneNumber: async () => await input.text("📱 Enter your phone number (with country code): "),
            password: async () => await input.text("🔒 Enter your 2FA Password (if enabled): "),
            phoneCode: async () => await input.text("💬 Enter the Telegram SMS/App validation code: "),
            onError: (err) => {
                throw err;
            }
        });

        console.log("\n✨ Verification Successful! Here is your secure string token:\n");
        console.log(client.session.save());
        console.log("\n⚠️ Copy the full string above and save it inside your .env file as USERBOT_SESSION_STRING.\n");

    } catch (error) {
        console.log("\n❌ Authentication Failed!");

        // Handle common Telegram authentication errors
        if (error.message.includes("PHONE_CODE_INVALID")) {
            console.error("👉 Reason: The SMS/App validation code you entered is incorrect or expired.");
        } else if (error.message.includes("PASSWORD_HASH_INVALID")) {
            console.error("👉 Reason: The 2FA password you entered is incorrect.");
        } else {
            console.error(`👉 Reason: ${error.message}`);
        }
        console.log("Please run the script again to retry.\n");
    } finally {
        await client.disconnect();
        process.exit(0);
    }
})();
