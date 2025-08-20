import { db } from "../../db";
import env from "../../env";
import { Bot, InlineKeyboard } from "grammy";
import { contracts, evmClient } from "../../evm";
import { deriveActor } from "./utils/actor";
import { tokens } from "../bot/tokens";

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

function getUserId(telegramId: number): number | null {
  const user = db
    .query("SELECT id FROM users WHERE telegram_id = ?")
    .get(telegramId) as { id: number } | undefined;
  return user ? user.id : null;
}

const userSessions = new Map<number, { step: string; data?: any }>();

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

  db.run(
    "INSERT INTO users (telegram_username, telegram_id, accepted_tnc_at, tnc_version) VALUES (?, ?, ?, ?, ?)",
    [tg_username, tg_id, accepted_tnc_at, tnc_version]
  );

  await ctx.answerCallbackQuery({ text: "Terms & Conditions accepted! ✅" });
  await ctx.editMessageText(
    "✅ Thank you for accepting our Terms & Conditions!\n\nYou can now start using our bot."
  );

  const options = new InlineKeyboard()
    .text("🤖 My Agents", `my_agents`)
    .row()
    .text("➕ New Agent", "add_agent")
    .row()
    .text("🪙 Token List", "token_list");

  const welcomeMessage = `🤖 Welcome to Caret Trading bot on the Sei Network!`;

  await ctx.reply(welcomeMessage, { reply_markup: options });
});

bot.callbackQuery("my_agents", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const userId = getUserId(ctx.from?.id!);
  if (!userId) {
    return ctx.reply("User not found. Please use /start to register.");
  }

  const agents = db.query("SELECT * FROM user_agents WHERE user_id = ?").all(userId);
  
  if (agents.length === 0) {
    const keyboard = new InlineKeyboard()
      .text("➕ Create Your First Agent", "add_agent")
      .row()
      .text("🔙 Back to Menu", "back_to_menu");
    
    return ctx.reply("🤖 You don't have any agents yet!\n\nCreate your first trading agent to get started.", { reply_markup: keyboard });
  }

  let message = "🤖 **Your Trading Agents:**\n\n";
  const keyboard = new InlineKeyboard();
  
  agents.forEach((agent: any, index: number) => {
    message += `${index + 1}. **${agent.agent_name}**\n`;
    message += `   📝 Instructions: ${agent.instructions.substring(0, 100)}${agent.instructions.length > 100 ? '...' : ''}\n`;
    message += `   🏦 Escrow: \`${agent.escrow_address}\`\n\n`;
    
    keyboard.text(`🔧 ${agent.agent_name}`, `agent_${agent.id}`).row();
  });
  
  keyboard.text("➕ Add New Agent", "add_agent").row();
  keyboard.text("🔙 Back to Menu", "back_to_menu");

  await ctx.reply(message, { reply_markup: keyboard, parse_mode: "Markdown" });
});

bot.callbackQuery("add_agent", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const keyboard = new InlineKeyboard()
    .text("🔙 Cancel", "back_to_menu");
  
  await ctx.reply("🤖 **Create New Trading Agent**\n\nPlease enter a name for your trading agent:", { reply_markup: keyboard, parse_mode: "Markdown" });
  
  userSessions.set(ctx.from!.id, { step: 'waiting_for_agent_name' });
});

bot.callbackQuery("token_list", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const tradableTokens = tokens.slice(0, 20);
  
  let message = "🪙 **Available Tokens for Trading**\n\n";
  
  tradableTokens.forEach((token, index) => {
    message += `${index + 1}. **${token.symbol}** - ${token.name}\n`;
  });
  
  message += `\n📊 **Total Tokens:** ${tokens.length}\n`;
  message += "💡 These are the tokens our trading agents can analyze and trade.\n";
  
  const keyboard = new InlineKeyboard()
    .text("🔙 Back to Menu", "back_to_menu");
  
  await ctx.reply(message, { reply_markup: keyboard, parse_mode: "Markdown" });
});

bot.callbackQuery("back_to_menu", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const options = new InlineKeyboard()
    .text("🤖 My Agents", `my_agents`)
    .row()
    .text("➕ New Agent", "add_agent")
    .row()
    .text("🪙 Token List", "token_list");

  const welcomeMessage = `🤖 Welcome to Caret Trading bot on the Sei Network!`;

  await ctx.reply(welcomeMessage, { reply_markup: options });
});

bot.on("message:text", async (ctx) => {
  const telegramId = ctx.from.id;
  const session = userSessions.get(telegramId);
  
  if (!session) {
    return;
  }
  
  const userId = getUserId(telegramId);
  if (!userId) {
    userSessions.delete(telegramId);
    return ctx.reply("User not found. Please use /start to register.");
  }
  
  if (session.step === 'waiting_for_agent_name') {
    const agentName = ctx.message.text.trim();
    
    if (agentName.length < 3) {
      return ctx.reply("❌ Agent name must be at least 3 characters long. Please try again:");
    }
    
    if (agentName.length > 50) {
      return ctx.reply("❌ Agent name must be less than 50 characters. Please try again:");
    }
    
    const existingAgent = db.query("SELECT id FROM user_agents WHERE user_id = ? AND agent_name = ?")
      .get(userId, agentName);
    
    if (existingAgent) {
      return ctx.reply("❌ You already have an agent with this name. Please choose a different name:");
    }
    
    session.data = { agentName };
    session.step = 'waiting_for_instructions';
    userSessions.set(telegramId, session);
    
    const keyboard = new InlineKeyboard()
      .text("🔙 Cancel", "back_to_menu");
    
    await ctx.reply(
      `✅ Agent name: **${agentName}**\n\n📝 Now please provide trading strategy instructions for your agent:\n\n💡 *Examples:*\n• "Focus on momentum trading with 2% stop loss"\n• "Buy the dip on major tokens with DCA strategy"\n• "Trade based on technical analysis with RSI signals"`,
      { reply_markup: keyboard, parse_mode: "Markdown" }
    );
    
  } else if (session.step === 'waiting_for_instructions') {
    const instructions = ctx.message.text.trim();
    
    if (instructions.length < 10) {
      return ctx.reply("❌ Instructions must be at least 10 characters long. Please provide more detailed trading strategy:");
    }
    
    if (instructions.length > 1000) {
      return ctx.reply("❌ Instructions must be less than 1000 characters. Please shorten your strategy description:");
    }
    
    try {
      const agentSeed = `${userId}_${session.data.agentName}_${Date.now()}`;
      const actor = await deriveActor(agentSeed);
      const escrowAddress = actor.account.address;
      
      const result = db.run(
        "INSERT INTO user_agents (user_id, agent_name, escrow_address, instructions) VALUES (?, ?, ?, ?)",
        [userId, session.data.agentName, escrowAddress, instructions]
      );
      
      userSessions.delete(telegramId);
      
      const keyboard = new InlineKeyboard()
        .text("🤖 View My Agents", "my_agents")
        .row()
        .text("➕ Create Another Agent", "add_agent")
        .row()
        .text("🔙 Back to Menu", "back_to_menu");
      
      await ctx.reply(
        `🎉 **Agent Created Successfully!**\n\n` +
        `🤖 **Name:** ${session.data.agentName}\n` +
        `📝 **Strategy:** ${instructions}\n` +
        `🏦 **Escrow Address:** \`${escrowAddress}\`\n\n` +
        `✅ Your agent is now ready to help with trading decisions!`,
        { reply_markup: keyboard, parse_mode: "Markdown" }
      );
      
    } catch (error) {
      console.error("Error creating agent:", error);
      userSessions.delete(telegramId);
      
      const keyboard = new InlineKeyboard()
        .text("🔄 Try Again", "add_agent")
        .row()
        .text("🔙 Back to Menu", "back_to_menu");
      
      await ctx.reply(
        "❌ **Error creating agent.** Please try again.",
        { reply_markup: keyboard, parse_mode: "Markdown" }
      );
    }
  }
});

bot.callbackQuery(/^agent_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const agentId = parseInt(ctx.match[1]);
  const userId = getUserId(ctx.from?.id!);
  
  if (!userId) {
    return ctx.reply("User not found. Please use /start to register.");
  }
  
  const agent = db.query("SELECT * FROM user_agents WHERE id = ? AND user_id = ?")
    .get(agentId, userId) as any;
  
  if (!agent) {
    return ctx.reply("❌ Agent not found or you don't have permission to view it.");
  }
  
  const keyboard = new InlineKeyboard()
    .text("🗑️ Delete Agent", `delete_agent_${agentId}`)
    .row()
    .text("🔙 Back to Agents", "my_agents");
  
  const message = `🤖 **Agent Details**\n\n` +
    `📛 **Name:** ${agent.agent_name}\n` +
    `📝 **Strategy Instructions:**\n${agent.instructions}\n\n` +
    `🏦 **Escrow Address:**\n\`${agent.escrow_address}\`\n\n` +
    `📅 **Created:** ${new Date(agent.created_at * 1000).toLocaleDateString()}`;
  
  await ctx.reply(message, { reply_markup: keyboard, parse_mode: "Markdown" });
});

bot.callbackQuery(/^delete_agent_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const agentId = parseInt(ctx.match[1]);
  const userId = getUserId(ctx.from?.id!);
  
  if (!userId) {
    return ctx.reply("User not found. Please use /start to register.");
  }
  
  const keyboard = new InlineKeyboard()
    .text("⚠️ Yes, Delete", `confirm_delete_${agentId}`)
    .text("❌ Cancel", `agent_${agentId}`);
  
  await ctx.reply("⚠️ **Are you sure you want to delete this agent?**\n\nThis action cannot be undone.", { reply_markup: keyboard, parse_mode: "Markdown" });
});

bot.callbackQuery(/^confirm_delete_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  
  const agentId = parseInt(ctx.match[1]);
  const userId = getUserId(ctx.from?.id!);
  
  if (!userId) {
    return ctx.reply("User not found. Please use /start to register.");
  }
  
  try {
    const result = db.run("DELETE FROM user_agents WHERE id = ? AND user_id = ?", [agentId, userId]);
    
    if (result.changes > 0) {
      const keyboard = new InlineKeyboard()
        .text("🤖 View My Agents", "my_agents")
        .row()
        .text("🔙 Back to Menu", "back_to_menu");
      
      await ctx.reply("✅ **Agent deleted successfully!**", { reply_markup: keyboard, parse_mode: "Markdown" });
    } else {
      await ctx.reply("❌ Agent not found or already deleted.");
    }
  } catch (error) {
    console.error("Error deleting agent:", error);
    await ctx.reply("❌ Error deleting agent. Please try again later.");
  }
});
