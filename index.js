import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import logger from "./logger.js";
dotenv.config();

// Initialize the bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Listen for Chat Join Requests
bot.on("chat_join_request", async (ctx) => {
  const request = ctx.chatJoinRequest;
  const userId = request.from.id;
  const chatId = request.chat.id;
  const userFirstName = request.from.first_name || "there";

  // Extract the Channel Name and Username
  const channelName = request.chat.title || "our channel";
  const channelUsername = request.chat.username;

  let isApproved = false;

  try {
    // Automatically approve the join request
    await ctx.telegram.approveChatJoinRequest(chatId, userId);
    isApproved = true;
  } catch (approveError) {
    isApproved = false;
    logger.error(
      `Failed to approve user ${userId}: ${approveError.message || approveError}`,
    );
  }

  const channelDisplay = channelUsername
    ? `<a href="https://t.me/${channelUsername}"><b>${channelName}</b></a>`
    : `<b>${channelName}</b>`;

  const welcomeMessage = `We have automatically approved your request to join ${channelDisplay}. You can now access and view the channel directly from your chat list!`;
  const errorMessage = `We encountered an issue automatically accepting your request to join ${channelDisplay}. Please try requesting again.`;

  try {
    // Send a private message to the user with Markdown enabled
    await ctx.telegram.sendMessage(
      request.user_chat_id,
      `Hello ${userFirstName}!\n\n${isApproved ? welcomeMessage : errorMessage}`,
      { parse_mode: "HTML" },
    );
  } catch (msgError) {
    logger.error(
      `Could not send DM to ${userId}: ${msgError.message || msgError}`,
    );
  }
});

// Text & Command Interceptor Handler
bot.on("message", async (ctx) => {
  if (ctx.chat.type !== "private") return;

  const botInfo = ctx.botInfo || (await ctx.telegram.getMe());
  const botUsername = botInfo.username;

  const descriptionMessage =
    `👋 Hello! I am a *Join Request Accepter* bot.\n\n` +
    `My job is to automatically approve join requests when users try to enter private channels or groups.\n\n` +
    `*Want me in your private channel/group?*\n` +
    `1. Add me as an *administrator* to your channel or group.\n` +
    `2. Give me permission to *Invite Users via Link* (or manage chat requests).\n` +
    `3. Turn on *Request Join* for your invite link.\n\n` +
    `Anyone who requests to join will then be approved automatically and greeted instantly!`;

  try {
    await ctx.reply(descriptionMessage, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "➕ Add me to your Channel",
              url: `https://t.me/${botUsername}?startchannel=true`,
            },
          ],
        ],
      },
    });
  } catch (err) {
    logger.error(`Failed to send description message: ${err.message || err}`);
  }
});

// Global error handling to keep the bot running 24/7 if an unexpected error occurs
bot.catch((err, ctx) => {
  logger.error(`Telegraf encountered an error for ${ctx.updateType}: ${err}`);
});

const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN_URL;
const WEBHOOK_PATH = `/telegram`;

if (process.env.NODE_ENV === "production") {
  // Launch using Webhook mode
  bot
    .launch({
      webhook: {
        domain: DOMAIN,
        port: Number(PORT),
        path: WEBHOOK_PATH,
      },
    })
    .then(() => {
      logger.info(
        `🚀 Bot running on Webhook mode via ${DOMAIN}${WEBHOOK_PATH} on port ${PORT}`,
      );
    });
} else {
  // Fallback to Long Polling for local computer testing
  bot.launch(() => {
    logger.info("🚀 Bot running on local Long Polling mode...");
  });
}

// Graceful stop for the server environment
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

process.on("uncaughtException", (err) => {
  logger.error(`💥 Uncaught Exception: ${err}`);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(`⚠️ Unhandled Rejection at: ${promise}. reason: ${reason}`);
});
