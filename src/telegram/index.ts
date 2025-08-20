import { db } from "../../db";
import env from "../../env";
import { Bot, InlineKeyboard } from "grammy";

export const bot = new Bot(env.TG_BOT_TOKEN!);

bot.use((ctx, next) => {
  if (ctx.chat?.type !== "private") {
    return ctx.reply("This bot can only be used in private chats (DMs).");
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

  db.run(
    "INSERT INTO users (telegram_username, telegram_id, accepted_tnc_at, tnc_version) VALUES (?, ?, ?, ?)",
    [tg_username, tg_id, accepted_tnc_at, tnc_version]
  );

  await ctx.answerCallbackQuery({ text: "Terms & Conditions accepted! ✅" });
  await ctx.editMessageText(
    "✅ Thank you for accepting our Terms & Conditions!\n\nYou can now start using our bot."
  );
});
