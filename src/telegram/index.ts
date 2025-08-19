import env from "../../env";
import { Bot, InlineKeyboard } from "grammy";

const bot = new Bot(env.TG_BOT_TOKEN!);

bot.use((ctx, next) => {
  if (ctx.chat?.type !== "private") {
    return ctx.reply("This bot can only be used in private chats (DMs).");
  }
  return next();
});

bot.command("start", (ctx) => {
  const keyboard = new InlineKeyboard()
    .url("� Read Terms & Conditions", "https://example.com/tnc")
    .row()
    .text("✅ Accept Terms & Conditions", "accept_tnc");

  const welcomeMessage = `🤖 Welcome to Caret Trading bot on the Sei Network!

Before you can use our services, please read and accept our Terms & Conditions.

Click the link to read the full terms, then click "Accept" to continue.

I will be waiting! 😀`;

  ctx.reply(welcomeMessage, { reply_markup: keyboard });
});

bot.callbackQuery("accept_tnc", async (ctx) => {
  console.log("=== USER ACCEPTED TnC ===");
  console.log("Full context:", JSON.stringify(ctx, null, 2));
  console.log("User info:", ctx.from);
  console.log("Chat info:", ctx.chat);
  console.log("Message info:", ctx.msg);
  console.log("Callback query:", ctx.callbackQuery);
  console.log("Update:", ctx.update);
  console.log("========================");

  await ctx.answerCallbackQuery({ text: "Terms & Conditions accepted! ✅" });
  await ctx.editMessageText(
    "✅ Thank you for accepting our Terms & Conditions!\n\nYou can now use our bot services."
  );
});

bot.start();
