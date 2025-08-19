import env from "../../env";
import { Bot, InlineKeyboard } from "grammy";

const bot = new Bot(env.TG_BOT_TOKEN!);

bot.command("start", (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("👍 Like", "like")
    .text("👎 Dislike", "dislike")
    .row()
    .url("🌐 Website", "https://example.com");

  ctx.reply("Choose an option:", { reply_markup: keyboard });
});

bot.callbackQuery("like", (ctx) =>
  ctx.answerCallbackQuery({ text: "You liked 👍" })
);
bot.callbackQuery("dislike", (ctx) =>
  ctx.answerCallbackQuery({ text: "You disliked 👎" })
);

bot.start();
bot.command("menu", (ctx) => {
  ctx.reply("Choose:", {
    reply_markup: {
      keyboard: [["Option 1", "Option 2"], ["Option 3"]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});

bot.hears("Option 1", (ctx) => ctx.reply("You picked Option 1 ✅"));
