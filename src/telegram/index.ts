import { db } from "../../db";
import env from "../../env";
import { Bot, InlineKeyboard } from "grammy";
import { contracts, evmClient } from "../../evm";
import { deriveActor } from "./utils/actor";

export const bot = new Bot(env.TG_BOT_TOKEN!);

bot.use((ctx, next) => {
  if (ctx.chat?.type !== "private") {
    return ctx.reply("This bot can only be used in private chats (DMs).");
  }
  return next();
});

function isUserRegistered(telegramId: number): boolean {
  const user = db
    .query("SELECT id FROM users WHERE telegram_id = ?")
    .get(telegramId);
  return !!user;
}

bot.use((ctx, next) => {
  const telegramId = ctx.from?.id;

  if (!telegramId) {
    return ctx.reply("Unable to identify user. Please try again.");
  }

  const isRegistered = isUserRegistered(telegramId);
  const isStartCommand = ctx.message?.text === "/start";
  const isAcceptTncCallback = ctx.callbackQuery?.data === "accept_tnc";

  if (!isRegistered) {
    if (!isStartCommand && !isAcceptTncCallback) {
      return ctx.reply(
        "Please use /start to register before using other commands."
      );
    }
  } else {
    if (isStartCommand) {
      return ctx.reply(
        "You are already registered! You can use the bot commands."
      );
    }
  }

  return next();
});

bot.command("start", (ctx) => {
  const keyboard = new InlineKeyboard()
    .url("📜 Read Terms & Conditions", `${env.SERVER_URL}/tnc`)
    .row()
    .text("✅ Accept Terms & Conditions", "accept_tnc");

  const welcomeMessage = `🤖 Welcome to Caret Trading bot on the Sei Network!

Before you can use our services, please read and accept our Terms & Conditions.

Click the link to read the full terms, then click "Accept" to continue.

I will be waiting! 😀`;

  ctx.reply(welcomeMessage, { reply_markup: keyboard });
});

bot.callbackQuery("accept_tnc", async (ctx) => {
  const tg_id = ctx.from?.id;
  const tg_username = ctx.from?.username;
  const accepted_tnc_at = Date.now();
  const tnc_version = 1;

  if (!(tg_username && tg_id)) {
    return ctx.reply(
      "Failed to retrieve user information. Is your profile public?"
    );
  }

  const actor = await deriveActor(`${tg_id}-@${tg_username}`);

  const hash = await contracts
    .CaretOrchestrator()
    .write.registerActor([BigInt(tg_id), actor.account.address]);
  await evmClient.waitForTransactionReceipt({ hash });

  const escrowAddress = await contracts
    .CaretOrchestrator()
    .read.escrows([actor.account.address]);

  db.run(
    "INSERT INTO users (telegram_username, telegram_id, accepted_tnc_at, tnc_version, escrow_address) VALUES (?, ?, ?, ?, ?)",
    [tg_username, tg_id, accepted_tnc_at, tnc_version, escrowAddress]
  );

  await ctx.answerCallbackQuery({ text: "Terms & Conditions accepted! ✅" });
  await ctx.editMessageText(
    "✅ Thank you for accepting our Terms & Conditions!\n\nYou can now start using our bot."
  );

  const options = new InlineKeyboard()
    .text("🤖 My Agents", `my_agents`)
    .row()
    .text("➕ New Agent", "add_agent");

  const welcomeMessage = `🤖 Welcome to Caret Trading bot on the Sei Network!`;

  await ctx.reply(welcomeMessage, { reply_markup: options });
});

bot.callbackQuery("my_agents", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("🤖 My Agents feature coming soon!");
});

bot.callbackQuery("add_agent", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply("➕ Add Agent feature coming soon!");
});
