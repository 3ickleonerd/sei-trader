import { db } from "../../db";
import env from "../../env";
import { Bot, InlineKeyboard } from "grammy";
import { contracts, evmClient } from "../../evm";
import { deriveActor } from "./utils/actor";
import { tokens } from "../bot/tokens";
import definitions from "../../definitions";
import { Agent } from "../bot/agent";

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

async function getUSDTBalance(escrowAddress: string): Promise<string> {
  try {
    const usdtContract = contracts.usdt();
    const balance = await usdtContract.read.balanceOf([
      escrowAddress as `0x${string}`,
    ]);
    const decimals = await usdtContract.read.decimals();

    const balanceFormatted = Number(balance) / Math.pow(10, Number(decimals));
    return balanceFormatted.toFixed(2);
  } catch (error) {
    console.error("Error fetching USDT balance:", error);
    return "0.00";
  }
}

async function getSEIBalance(escrowAddress: string): Promise<string> {
  try {
    const balance = await evmClient.getBalance({
      address: escrowAddress as `0x${string}`,
    });

    const balanceFormatted = Number(balance) / Math.pow(10, 18);
    return balanceFormatted.toFixed(4);
  } catch (error) {
    console.error("Error fetching SEI balance:", error);
    return "0.0000";
  }
}

async function getAllTokenBalances(
  escrowAddress: string
): Promise<Array<{ symbol: string; balance: string; name: string }>> {
  const balances: Array<{ symbol: string; balance: string; name: string }> = [];

  try {
    const seiBalance = await getSEIBalance(escrowAddress);
    if (parseFloat(seiBalance) > 0) {
      balances.push({
        symbol: "SEI",
        balance: seiBalance,
        name: "SEI",
      });
    }

    const usdtBalance = await getUSDTBalance(escrowAddress);
    if (parseFloat(usdtBalance) > 0) {
      balances.push({
        symbol: "USDT",
        balance: usdtBalance,
        name: "USDT",
      });
    }

    if (definitions.tokens) {
      for (const [symbol, tokenDef] of Object.entries(definitions.tokens)) {
        try {
          const tokenContract = {
            address: tokenDef.address,
            abi: tokenDef.abi,
          } as const;

          const balance = await evmClient.readContract({
            address: tokenContract.address,
            abi: tokenContract.abi,
            functionName: "balanceOf",
            args: [escrowAddress as `0x${string}`],
          });

          const decimals = await evmClient.readContract({
            address: tokenContract.address,
            abi: tokenContract.abi,
            functionName: "decimals",
            args: [],
          });

          const name = await evmClient.readContract({
            address: tokenContract.address,
            abi: tokenContract.abi,
            functionName: "name",
            args: [],
          });

          const balanceFormatted =
            Number(balance) / Math.pow(10, Number(decimals));

          if (balanceFormatted > 0) {
            balances.push({
              symbol,
              balance: balanceFormatted.toFixed(6),
              name: name as string,
            });
          }
        } catch (error) {
          console.error(`Error fetching balance for ${symbol}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching token balances:", error);
  }

  return balances;
}

const userSessions = new Map<number, { step: string; data?: any }>();

enum MessageType {
  CHAT = "chat",
  TRADE_EXECUTION = "trade_execution",
  TRADE_RECOMMENDATION = "trade_recommendation",
  AGENT_SETUP = "agent_setup",
}

interface ClassificationResult {
  type: MessageType;
  confidence: number;
  extractedData?: {
    token?: string;
    action?: string;
    amount?: number;
  };
}

async function classifyMessage(message: string): Promise<ClassificationResult> {
  const lowerMessage = message.toLowerCase().trim();

  const agentSetupKeywords = [
    "create agent",
    "new agent",
    "add agent",
    "setup agent",
    "make agent",
  ];
  if (agentSetupKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    return {
      type: MessageType.AGENT_SETUP,
      confidence: 0.9,
    };
  }

  const executionKeywords = [
    "buy",
    "sell",
    "execute",
    "trade",
    "purchase",
    "swap",
  ];
  const amountKeywords = ["$", "usdt", "dollar", "worth"];

  const hasExecutionKeyword = executionKeywords.some((keyword) =>
    lowerMessage.includes(keyword)
  );
  const hasAmountOrToken =
    amountKeywords.some((keyword) => lowerMessage.includes(keyword)) ||
    tokens.some((token) => lowerMessage.includes(token.symbol.toLowerCase()));

  if (hasExecutionKeyword && hasAmountOrToken) {
    const action = executionKeywords.find((keyword) =>
      lowerMessage.includes(keyword)
    );
    const token = tokens.find((t) =>
      lowerMessage.includes(t.symbol.toLowerCase())
    )?.symbol;

    const amountMatch = lowerMessage.match(
      /(\d+(?:\.\d+)?)\s*(?:\$|usdt|dollar)/
    );
    const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;

    return {
      type: MessageType.TRADE_EXECUTION,
      confidence: 0.8,
      extractedData: {
        token,
        action,
        amount,
      },
    };
  }

  const recommendationKeywords = [
    "recommend",
    "suggestion",
    "advice",
    "what should i",
    "trade idea",
    "analysis",
    "prediction",
    "forecast",
    "outlook",
    "should i buy",
    "should i sell",
    "good trade",
    "trading opportunity",
  ];

  if (
    recommendationKeywords.some((keyword) => lowerMessage.includes(keyword))
  ) {
    return {
      type: MessageType.TRADE_RECOMMENDATION,
      confidence: 0.7,
    };
  }

  return {
    type: MessageType.CHAT,
    confidence: 0.6,
  };
}

async function handleChatMessage(ctx: any, message: string): Promise<void> {
  const chatAgent = new Agent({
    model: "gemini-2.0-flash",
    preamble: `You are a helpful cryptocurrency trading bot assistant. 
    
    The user is chatting with you casually. Provide a friendly, helpful response while gently encouraging them to use the trading bot features.
    
    Keep responses concise and friendly. Always mention that they can use the bot's trading features for specific trading help.
    
    Available bot features:
    - Create trading agents with custom strategies
    - Get trade recommendations
    - Execute trades (if agents are funded)
    - View market data
    
    Don't provide specific trading advice in chat - direct them to use the bot's trading features instead.`,
  });

  try {
    const response = await chatAgent.prompt(message);
    const responseText =
      response?.parts?.[0]?.text ||
      "I'm here to help! Use the menu buttons to access trading features.";

    const keyboard = new InlineKeyboard()
      .text("🤖 My Agents", "my_agents")
      .text("➕ New Agent", "add_agent")
      .row()
      .text("🪙 Token List", "token_list")
      .text("📊 Main Menu", "back_to_menu");

    await ctx.reply(
      `${responseText}\n\n💡 **Quick Access:**\nUse the buttons below to access trading features!`,
      { reply_markup: keyboard, parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error in chat response:", error);

    const keyboard = new InlineKeyboard()
      .text("🤖 My Agents", "my_agents")
      .text("➕ New Agent", "add_agent")
      .row()
      .text("📊 Main Menu", "back_to_menu");

    await ctx.reply(
      "Hi! I'm your trading bot assistant. 🤖\n\n" +
        "I can help you create trading agents, get recommendations, and execute trades.\n\n" +
        "Use the buttons below to get started!",
      { reply_markup: keyboard, parse_mode: "Markdown" }
    );
  }
}

async function handleTradeExecution(
  ctx: any,
  message: string,
  extractedData: any
): Promise<void> {
  const userId = getUserId(ctx.from?.id!);
  if (!userId) {
    return ctx.reply("User not found. Please use /start to register.");
  }

  const agents = db
    .query("SELECT * FROM user_agents WHERE user_id = ?")
    .all(userId);

  if (agents.length === 0) {
    const keyboard = new InlineKeyboard()
      .text("➕ Create Your First Agent", "add_agent")
      .row()
      .text("🔙 Back to Menu", "back_to_menu");

    return ctx.reply(
      "🤖 **Trade Execution Request Detected**\n\n" +
        "To execute trades, you need to create a trading agent first.\n\n" +
        "💡 **What was detected:**\n" +
        `• Action: ${extractedData.action || "trade"}\n` +
        `• Token: ${extractedData.token || "not specified"}\n` +
        `• Amount: ${
          extractedData.amount ? `$${extractedData.amount}` : "not specified"
        }\n\n` +
        "Create an agent to get started with automated trading!",
      { reply_markup: keyboard, parse_mode: "Markdown" }
    );
  }

  let responseMessage = "🤖 **Trade Execution Request**\n\n";
  responseMessage += "💡 **Detected Trade Details:**\n";
  responseMessage += `• Action: ${extractedData.action || "trade"}\n`;
  responseMessage += `• Token: ${extractedData.token || "not specified"}\n`;
  responseMessage += `• Amount: ${
    extractedData.amount ? `$${extractedData.amount}` : "not specified"
  }\n\n`;
  responseMessage +=
    "⚠️ **Note:** Direct trade execution is not yet implemented. Use your agents for trade suggestions and manual execution.\n\n";
  responseMessage += "🤖 **Your Available Agents:**\n";

  const keyboard = new InlineKeyboard();

  for (let i = 0; i < Math.min(agents.length, 3); i++) {
    const agent: any = agents[i];
    responseMessage += `${i + 1}. ${agent.agent_name}\n`;
    keyboard.text(`🤖 ${agent.agent_name}`, `agent_${agent.id}`).row();
  }

  keyboard.text("🔙 Back to Menu", "back_to_menu");

  await ctx.reply(responseMessage, {
    reply_markup: keyboard,
    parse_mode: "Markdown",
  });
}

async function handleTradeRecommendation(
  ctx: any,
  message: string
): Promise<void> {
  const userId = getUserId(ctx.from?.id!);
  if (!userId) {
    return ctx.reply("User not found. Please use /start to register.");
  }

  const agents = db
    .query("SELECT * FROM user_agents WHERE user_id = ?")
    .all(userId);

  if (agents.length === 0) {
    const keyboard = new InlineKeyboard()
      .text("➕ Create Your First Agent", "add_agent")
      .row()
      .text("🔙 Back to Menu", "back_to_menu");

    return ctx.reply(
      "🤖 **Trade Recommendation Request**\n\n" +
        "To get personalized trade recommendations, you need to create a trading agent with your strategy first.\n\n" +
        "Your agent will analyze the market based on your specific instructions and provide tailored recommendations.",
      { reply_markup: keyboard, parse_mode: "Markdown" }
    );
  }

  let responseMessage = "🤖 **Trade Recommendation Request**\n\n";
  responseMessage +=
    "Choose an agent to get a personalized trade recommendation based on their strategy:\n\n";

  const keyboard = new InlineKeyboard();

  for (let i = 0; i < agents.length; i++) {
    const agent: any = agents[i];
    responseMessage += `${i + 1}. **${agent.agent_name}**\n`;
    responseMessage += `   Strategy: ${agent.instructions.substring(0, 80)}${
      agent.instructions.length > 80 ? "..." : ""
    }\n\n`;
    keyboard
      .text(`💡 ${agent.agent_name} Suggestion`, `trade_suggestion_${agent.id}`)
      .row();
  }

  keyboard.text("🔙 Back to Menu", "back_to_menu");

  await ctx.reply(responseMessage, {
    reply_markup: keyboard,
    parse_mode: "Markdown",
  });
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

  db.run(
    "INSERT INTO users (telegram_username, telegram_id, accepted_tnc_at, tnc_version) VALUES (?, ?, ?, ?)",
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

  const agents = db
    .query("SELECT * FROM user_agents WHERE user_id = ?")
    .all(userId);

  if (agents.length === 0) {
    const keyboard = new InlineKeyboard()
      .text("➕ Create Your First Agent", "add_agent")
      .row()
      .text("🔙 Back to Menu", "back_to_menu");

    return ctx.reply(
      "🤖 You don't have any agents yet!\n\n" +
        "Create your first trading agent to get started.\n\n" +
        "💡 **Important:** After creating an agent, you'll need to fund its escrow address with tokens for the bot to be able to execute trades on your behalf.",
      { reply_markup: keyboard, parse_mode: "Markdown" }
    );
  }

  let message = "🤖 **Your Trading Agents:**\n\n";
  const keyboard = new InlineKeyboard();

  for (let index = 0; index < agents.length; index++) {
    const agent: any = agents[index];
    const usdtBalance = await getUSDTBalance(agent.escrow_address);
    const seiBalance = await getSEIBalance(agent.escrow_address);

    message += `${index + 1}. **${agent.agent_name}**\n`;
    message += `   📝 Instructions: ${agent.instructions.substring(0, 100)}${
      agent.instructions.length > 100 ? "..." : ""
    }\n`;
    message += `   🏦 Escrow: \`${agent.escrow_address}\`\n`;
    message += `   💰 USDT Balance: **${usdtBalance} USDT**\n`;
    message += `   🔷 SEI Balance: **${seiBalance} SEI**\n\n`;

    keyboard.text(`🔧 ${agent.agent_name}`, `agent_${agent.id}`).row();
  }

  message += "💰 **Funding Instructions:**\n";
  message +=
    "To enable trading, send **USDT only** to your agent's escrow address. Your agent can only trade with USDT available in its escrow. Use the 'Fund Agent' button to get the escrow address and USDT contract details.\n\n";

  keyboard.text("➕ Add New Agent", "add_agent").row();
  keyboard.text("🔙 Back to Menu", "back_to_menu");

  await ctx.reply(message, { reply_markup: keyboard, parse_mode: "Markdown" });
});

bot.callbackQuery("add_agent", async (ctx) => {
  await ctx.answerCallbackQuery();

  const keyboard = new InlineKeyboard().text("🔙 Cancel", "back_to_menu");

  await ctx.reply(
    "🤖 **Create New Trading Agent**\n\n" +
      "Please enter a name for your trading agent:\n\n" +
      "💡 **Note:** After creation, you'll need to fund the agent's escrow address with **USDT only** to enable trading.",
    { reply_markup: keyboard, parse_mode: "Markdown" }
  );

  userSessions.set(ctx.from!.id, { step: "waiting_for_agent_name" });
});

bot.callbackQuery("token_list", async (ctx) => {
  await ctx.answerCallbackQuery();

  const tradableTokens = tokens;

  let message = "🪙 **Available Tokens for Trading**\n\n";

  tradableTokens.forEach((token, index) => {
    message += `${index + 1}. **${token.symbol}** - ${token.name}\n`;
  });

  message += `\n📊 **Total Tokens:** ${tokens.length}\n`;
  message +=
    "💡 These are the tokens our trading agents can analyze and trade.\n";

  const keyboard = new InlineKeyboard().text("🔙 Back to Menu", "back_to_menu");

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
  const messageText = ctx.message.text.trim();

  if (session) {
    const userId = getUserId(telegramId);
    if (!userId) {
      userSessions.delete(telegramId);
      return ctx.reply("User not found. Please use /start to register.");
    }

    if (session.step === "waiting_for_agent_name") {
      const agentName = messageText;

      if (agentName.length < 3) {
        return ctx.reply(
          "❌ Agent name must be at least 3 characters long. Please try again:"
        );
      }

      if (agentName.length > 50) {
        return ctx.reply(
          "❌ Agent name must be less than 50 characters. Please try again:"
        );
      }

      const existingAgent = db
        .query(
          "SELECT id FROM user_agents WHERE user_id = ? AND agent_name = ?"
        )
        .get(userId, agentName);

      if (existingAgent) {
        return ctx.reply(
          "❌ You already have an agent with this name. Please choose a different name:"
        );
      }

      session.data = { agentName };
      session.step = "waiting_for_instructions";
      userSessions.set(telegramId, session);

      const keyboard = new InlineKeyboard().text("🔙 Cancel", "back_to_menu");

      await ctx.reply(
        `✅ Agent name: **${agentName}**\n\n📝 Now please provide trading strategy instructions for your agent:\n\n💡 *Examples:*\n• "Focus on momentum trading with 2% stop loss"\n• "Buy the dip on major tokens with DCA strategy"\n• "Trade based on technical analysis with RSI signals"`,
        { reply_markup: keyboard, parse_mode: "Markdown" }
      );
      return;
    }

    if (session.step === "waiting_for_instructions") {
      const instructions = messageText;

      if (instructions.length < 10) {
        return ctx.reply(
          "❌ Instructions must be at least 10 characters long. Please provide more detailed trading strategy:"
        );
      }

      if (instructions.length > 1000) {
        return ctx.reply(
          "❌ Instructions must be less than 1000 characters. Please shorten your strategy description:"
        );
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
            `⚠️ **Important - Funding Required:**\n` +
            `Before your agent can execute trades, you must fund its escrow address with the tokens you want to trade. Send your desired trading tokens (e.g., SEI, USDC, etc.) to the escrow address above.\n\n` +
            `💡 **Note:** Your agent can only trade with tokens available in its escrow balance. The bot will not be able to place trades until the escrow is funded.\n\n` +
            `✅ Your agent is now ready to help with trading decisions once funded!`,
          { reply_markup: keyboard, parse_mode: "Markdown" }
        );
        return;
      } catch (error) {
        console.error("Error creating agent:", error);
        userSessions.delete(telegramId);

        const keyboard = new InlineKeyboard()
          .text("🔄 Try Again", "add_agent")
          .row()
          .text("🔙 Back to Menu", "back_to_menu");

        await ctx.reply("❌ **Error creating agent.** Please try again.", {
          reply_markup: keyboard,
          parse_mode: "Markdown",
        });
        return;
      }
    }
  }

  try {
    console.log(`Classifying message: "${messageText}"`);
    const classification = await classifyMessage(messageText);
    console.log(`Classification result:`, classification);

    switch (classification.type) {
      case MessageType.TRADE_EXECUTION:
        await handleTradeExecution(
          ctx,
          messageText,
          classification.extractedData
        );
        break;

      case MessageType.TRADE_RECOMMENDATION:
        await handleTradeRecommendation(ctx, messageText);
        break;

      case MessageType.AGENT_SETUP:
        const keyboard = new InlineKeyboard()
          .text("➕ Create New Agent", "add_agent")
          .row()
          .text("🤖 View My Agents", "my_agents")
          .row()
          .text("🔙 Back to Menu", "back_to_menu");

        await ctx.reply(
          "🤖 **Agent Setup Request Detected**\n\n" +
            "I can help you create a new trading agent with custom strategies!\n\n" +
            "Click the button below to start the setup process.",
          { reply_markup: keyboard, parse_mode: "Markdown" }
        );
        break;

      case MessageType.CHAT:
      default:
        await handleChatMessage(ctx, messageText);
        break;
    }
  } catch (error) {
    console.error("Error handling message:", error);

    const keyboard = new InlineKeyboard()
      .text("🤖 My Agents", "my_agents")
      .text("➕ New Agent", "add_agent")
      .row()
      .text("📊 Main Menu", "back_to_menu");

    await ctx.reply(
      "Sorry, I had trouble understanding your message. 🤔\n\n" +
        "You can use the buttons below to access the trading features!",
      { reply_markup: keyboard, parse_mode: "Markdown" }
    );
  }
});

bot.callbackQuery(/^agent_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();

  const agentId = parseInt(ctx.match[1]);
  const userId = getUserId(ctx.from?.id!);

  if (!userId) {
    return ctx.reply("User not found. Please use /start to register.");
  }

  const agent = db
    .query("SELECT * FROM user_agents WHERE id = ? AND user_id = ?")
    .get(agentId, userId) as any;

  if (!agent) {
    return ctx.reply(
      "❌ Agent not found or you don't have permission to view it."
    );
  }

  const keyboard = new InlineKeyboard()
    .text("🤖 Trade Suggestion", `trade_suggestion_${agentId}`)
    .text("💰 Agent Balance", `agent_balance_${agentId}`)
    .row()
    .text("🗑️ Delete Agent", `delete_agent_${agentId}`)
    .text("� Fund Agent", `fund_agent_${agentId}`)
    .row()
    .text("🔙 Back to Agents", "my_agents");

  const message =
    `🤖 **Agent Details**\n\n` +
    `📛 **Name:** ${agent.agent_name}\n` +
    `📝 **Strategy Instructions:**\n${agent.instructions}\n\n` +
    `🏦 **Escrow Address:**\n\`${agent.escrow_address}\`\n\n` +
    `� **Funding Status:**\n` +
    `To enable trading, send tokens to the escrow address above. The agent can only trade with tokens available in its escrow balance.\n\n` +
    `�📅 **Created:** ${new Date(
      agent.created_at * 1000
    ).toLocaleDateString()}`;

  await ctx.reply(message, { reply_markup: keyboard, parse_mode: "Markdown" });
});

bot.callbackQuery(/^trade_suggestion_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery({ text: "Generating trade suggestion..." });

  const agentId = parseInt(ctx.match[1]);
  const userId = getUserId(ctx.from?.id!);

  if (!userId) {
    return ctx.reply("User not found. Please use /start to register.");
  }

  const agent = db
    .query("SELECT * FROM user_agents WHERE id = ? AND user_id = ?")
    .get(agentId, userId) as any;

  if (!agent) {
    return ctx.reply(
      "❌ Agent not found or you don't have permission to access it."
    );
  }

  try {
    const loadingMessage = await ctx.reply(
      "🤖 **Analyzing market conditions...**\n\n" +
        "Your trading agent is analyzing current market data and applying your strategy instructions to generate a personalized trade suggestion.\n\n" +
        "⏳ This may take a few moments...",
      { parse_mode: "Markdown" }
    );

    const tradingAgent = new Agent({
      model: "gemini-2.0-flash",
      preamble: `You are a professional cryptocurrency trading agent with specific user instructions.`,
    });

    const userPrompt = `Based on my trading strategy and current market conditions, provide a trade suggestion. My strategy instructions are: "${agent.instructions}"`;

    const result = await tradingAgent.enhancedWorkflow(userPrompt);

    await ctx.api.deleteMessage(ctx.chat?.id!, loadingMessage.message_id);

    const keyboard = new InlineKeyboard()
      .text("🔄 Get Another Suggestion", `trade_suggestion_${agentId}`)
      .row()
      .text("🤖 Back to Agent", `agent_${agentId}`)
      .row()
      .text("🔙 Back to Agents", "my_agents");

    if (result.error) {
      return ctx.reply(
        `❌ **Error generating trade suggestion:**\n\n${result.error}\n\nPlease try again later.`,
        { reply_markup: keyboard, parse_mode: "Markdown" }
      );
    }

    let responseMessage = `🤖 **Trade Suggestion from ${agent.agent_name}**\n\n`;

    if (result.tradeDecision) {
      const td = result.tradeDecision;
      responseMessage += `🎯 **Recommended Trade:**\n`;
      responseMessage += `• **Token:** ${td.token.toUpperCase()}\n`;
      responseMessage += `• **Entry Price:** $${td.entry.toFixed(4)}\n`;
      responseMessage += `• **Current Price:** $${td.currentPrice.toFixed(
        4
      )}\n`;
      responseMessage += `• **Stop Loss:** $${td.sl.toFixed(4)}\n`;
      responseMessage += `• **Take Profit:** $${td.tp.toFixed(4)}\n`;
      responseMessage += `• **Confidence:** ${td.confidence}%\n\n`;
      responseMessage += `📊 **Analysis:**\n${td.message}\n\n`;
    } else if (result.genericAdvice) {
      const ga = result.genericAdvice;
      responseMessage += `📈 **Market Analysis:**\n${ga.reasoning}\n\n`;

      if (ga.suggestedToken) {
        responseMessage += `💡 **Suggested Token:** ${ga.suggestedToken.toUpperCase()}\n\n`;
      }

      if (ga.needsSpecificTokenData && ga.requestedTokens) {
        responseMessage += `🔍 **Additional Analysis Needed:**\nFor more specific recommendations, consider analyzing: ${ga.requestedTokens.join(
          ", "
        )}\n\n`;
      }
    }

    responseMessage += `⚠️ **Strategy Context:**\n"${agent.instructions}"\n\n`;
    responseMessage += `📋 **Risk Warning:**\nThis is not financial advice. Always do your own research and never invest more than you can afford to lose.`;

    await ctx.reply(responseMessage, {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error generating trade suggestion:", error);

    const keyboard = new InlineKeyboard()
      .text("🔄 Try Again", `trade_suggestion_${agentId}`)
      .row()
      .text("🤖 Back to Agent", `agent_${agentId}`)
      .row()
      .text("🔙 Back to Agents", "my_agents");

    await ctx.reply(
      "❌ **Error generating trade suggestion**\n\n" +
        "There was an error processing your request. Please try again in a moment.",
      { reply_markup: keyboard, parse_mode: "Markdown" }
    );
  }
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

  await ctx.reply(
    "⚠️ **Are you sure you want to delete this agent?**\n\nThis action cannot be undone.",
    { reply_markup: keyboard, parse_mode: "Markdown" }
  );
});

bot.callbackQuery(/^confirm_delete_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();

  const agentId = parseInt(ctx.match[1]);
  const userId = getUserId(ctx.from?.id!);

  if (!userId) {
    return ctx.reply("User not found. Please use /start to register.");
  }

  try {
    const result = db.run(
      "DELETE FROM user_agents WHERE id = ? AND user_id = ?",
      [agentId, userId]
    );

    if (result.changes > 0) {
      const keyboard = new InlineKeyboard()
        .text("🤖 View My Agents", "my_agents")
        .row()
        .text("🔙 Back to Menu", "back_to_menu");

      await ctx.reply("✅ **Agent deleted successfully!**", {
        reply_markup: keyboard,
        parse_mode: "Markdown",
      });
    } else {
      await ctx.reply("❌ Agent not found or already deleted.");
    }
  } catch (error) {
    console.error("Error deleting agent:", error);
    await ctx.reply("❌ Error deleting agent. Please try again later.");
  }
});

bot.callbackQuery(/^fund_agent_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();

  const agentId = parseInt(ctx.match[1]);
  const userId = getUserId(ctx.from?.id!);

  if (!userId) {
    return ctx.reply("User not found. Please use /start to register.");
  }

  const agent = db
    .query("SELECT * FROM user_agents WHERE id = ? AND user_id = ?")
    .get(agentId, userId) as any;

  if (!agent) {
    return ctx.reply(
      "❌ Agent not found or you don't have permission to fund it."
    );
  }

  const escrowAddress = agent.escrow_address;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${escrowAddress}`;

  const keyboard = new InlineKeyboard()
    .text("🔙 Back to Agent", `agent_${agentId}`)
    .row()
    .text("🤖 View My Agents", "my_agents");

  const message =
    `💰 **Fund Agent: ${agent.agent_name}**\n\n` +
    `Send **USDT only** to this escrow address to enable trading:\n\n` +
    `**Escrow Address:**\n` +
    `\`${escrowAddress}\`\n\n` +
    `**USDT on Sei Address:**\n` +
    `\`${definitions.USDT.address}\`\n\n` +
    `📱 **Scan the QR code below or copy the escrow address above**\n\n` +
    `⚠️ **Important:** \n` +
    `• Only send USDT on Sei network\n` +
    `• The agent can only trade with USDT in its escrow balance\n` +
    `• Make sure to send to the escrow address, not the USDT contract address`;

  try {
    await ctx.replyWithPhoto(qrCodeUrl, {
      caption: message,
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error sending QR code:", error);
    await ctx.reply(message, {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });
  }
});

bot.callbackQuery(/^agent_balance_(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery({ text: "Fetching agent balances..." });

  const agentId = parseInt(ctx.match[1]);
  const userId = getUserId(ctx.from?.id!);

  if (!userId) {
    return ctx.reply("User not found. Please use /start to register.");
  }

  const agent = db
    .query("SELECT * FROM user_agents WHERE id = ? AND user_id = ?")
    .get(agentId, userId) as any;

  if (!agent) {
    return ctx.reply(
      "❌ Agent not found or you don't have permission to view its balance."
    );
  }

  try {
    const balances = await getAllTokenBalances(agent.escrow_address);

    let message = `💰 **${agent.agent_name} - Token Balances**\n\n`;
    message += `🏦 **Escrow Address:**\n\`${agent.escrow_address}\`\n\n`;

    if (balances.length === 0) {
      message += `📭 **No token balances found**\n\n`;
      message += `The agent's escrow wallet is empty. To enable trading, send USDT to the escrow address above.`;
    } else {
      message += `📊 **Available Balances:**\n\n`;

      balances.forEach((token) => {
        message += `• **${token.symbol}** (${token.name}): \`${token.balance}\`\n`;
      });

      message += `\n💡 **Note:** The agent can trade with any tokens available in its escrow balance.`;
    }

    const keyboard = new InlineKeyboard()
      .text("🔄 Refresh Balance", `agent_balance_${agentId}`)
      .row()
      .text("💸 Fund Agent", `fund_agent_${agentId}`)
      .text("🔙 Back to Agent", `agent_${agentId}`)
      .row()
      .text("🤖 View My Agents", "my_agents");

    await ctx.reply(message, {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error fetching agent balances:", error);
    await ctx.reply(
      "❌ Error fetching agent balances. Please try again later.",
      {
        reply_markup: new InlineKeyboard().text(
          "🔙 Back to Agent",
          `agent_${agentId}`
        ),
      }
    );
  }
});
