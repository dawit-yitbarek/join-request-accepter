import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import dotenv from 'dotenv';

dotenv.config();

// Set up GramJS Credentials
const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const userbotSessionString = process.env.USERBOT_SESSION_STRING;

// The raw ID string parses smoothly into BigInt (must be without the -100 prefix)
const rawChannelId = BigInt(process.env.CHANNEL_CHAT_ID);

if (!apiId || !apiHash || !userbotSessionString || !rawChannelId) {
    console.error("❌ Error: Please define TELEGRAM_API_ID, TELEGRAM_API_HASH, USERBOT_SESSION_STRING and CHANNEL_CHAT_ID inside your .env file first.");
    process.exit(1);
}

const userbotSession = new StringSession(userbotSessionString || "");
const userbot = new TelegramClient(userbotSession, apiId, apiHash, {});

const fetchPendingJoinRequest = async () => {
    try {
        console.log("Connecting Userbot helper engine...");
        await userbot.connect();
        console.log("Userbot engine is online!");

        console.log("🔄 Fetching pending join requests from the channel...");

        const peerTarget = new Api.PeerChannel({
            channelId: rawChannelId
        });

        let channelEntity;

        try {
            channelEntity = await userbot.getInputEntity(peerTarget);
        } catch (cacheError) {
            console.log("Channel not found in session cache. Refreshing dialogs...");
            // Pull raw user context dialog structure to let GramJS cache the target channel hash
            await userbot.getDialogs({});
            channelEntity = await userbot.getInputEntity(peerTarget);
        }

        const result = await userbot.invoke(
            new Api.messages.GetChatInviteImporters({
                peer: channelEntity,
                requested: true,
                limit: 50,
                offsetDate: 0,
                offsetUser: new Api.InputUserEmpty()
            })
        );


        if (result && result.users && result.users.length > 0) {

            const totalCount = result.users.length;
            let approvedCount = 0;

            // 2. Loop through each user and approve them
            for (const user of result.users) {
                try {
                    await userbot.invoke(
                        new Api.messages.HideChatJoinRequest({
                            peer: channelEntity,
                            userId: user.id,
                            approved: true
                        })
                    );
                    approvedCount++;
                } catch (approveError) {
                    console.error(`Failed to approve user ${user.id}:`, approveError.message);
                }
            }

            console.log(`✅ Successfully approved ${approvedCount} pending users out of ${totalCount}!`)
        } else {
            console.log("✅ No pending join requests found for this channel.");
        }

    } catch (err) {
        console.error("Failed to run the script:", err);
    } finally {
        process.exit(1);
    }
}

fetchPendingJoinRequest();