# Deployment Guide

## 🚀 Deployment Overview

This guide covers the complete deployment process for Sei Trader, from development setup to production deployment on the Sei Network.

---

## 🛠️ Development Setup

### Prerequisites

Before setting up Sei Trader, ensure you have the following installed:

- **Bun.js** (v1.0+): High-performance JavaScript runtime
- **Node.js** (v18+): For compatibility with some packages
- **Git**: Version control
- **VSCode**: Recommended IDE with TypeScript support

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/seiTrader.git
cd seiTrader

# Install dependencies
bun install

# Install EVM dependencies
cd evm && bun install && cd ..
```

### 2. Environment Setup

Create environment configuration files:

```bash
# Copy environment template
cp .env.template .env
```

#### Required Environment Variables

```bash
# .env file configuration

# Google AI API Key (for Gemini model)
GOOGLE_API_KEY=your_gemini_api_key_here

# Telegram Bot Token
TG_BOT_TOKEN=your_telegram_bot_token

# Private key for blockchain interactions (without 0x prefix)
PVT_KEY=your_private_key_here

# Server configuration
PORT=3000
NODE_ENV=development

# Database configuration
DATABASE_URL=./data/database.sqlite

# API configurations
COINGECKO_API_KEY=your_coingecko_api_key (optional)
```

#### Getting API Keys

##### Google AI API Key
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Create or select a project
3. Generate an API key for Gemini
4. Add billing information (required for production usage)

##### Telegram Bot Token
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` command
3. Follow instructions to create your bot
4. Copy the provided token

##### Private Key Setup
```bash
# Generate a new wallet (for development)
bun run scripts/generate-wallet.ts

# Or use an existing wallet
# Make sure it has SEI tokens for gas fees
```

### 3. Database Setup

```bash
# Initialize database
bun run db:generate
bun run db:migrate

# Verify database setup
ls -la data/
```

#### Database Schema
```sql
-- Core tables created during migration
CREATE TABLE user_agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  agent_name TEXT NOT NULL UNIQUE,
  escrow_address TEXT NOT NULL,
  actor_address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trade_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER NOT NULL,
  token_symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  price DECIMAL(18,8) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tx_hash TEXT,
  FOREIGN KEY (agent_id) REFERENCES user_agents(id)
);
```

---

## 🔧 Smart Contract Deployment

### 1. Hardhat Configuration

The EVM contracts are managed through Hardhat. Configuration is in `evm/hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337
    },
    seiTestnet: {
      url: "https://evm-rpc-testnet.sei-apis.com",
      chainId: 713715,
      accounts: [process.env.PVT_KEY!]
    }
  }
};
```

### 2. Contract Compilation

```bash
# Navigate to EVM directory
cd evm

# Compile smart contracts
bun run compile

# Verify compilation
ls -la artifacts/contracts/
```

### 3. Contract Deployment

#### Testnet Deployment
```bash
# Deploy to Sei Testnet
bun run migrate

# Expected output:
# ✅ USDT deployed to: 0x...
# ✅ CaretOrchestrator deployed to: 0x...
# ✅ Contracts verified on explorer
```

#### Manual Deployment Script
```typescript
// scripts/deploy.ts
import { parseEther } from "viem";
import { evmClient } from "../evm";

async function deployContracts() {
  console.log("🚀 Deploying contracts...");
  
  // Deploy USDT token (for testing)
  const usdt = await evmClient.deployContract({
    abi: TestTokenABI,
    bytecode: TestTokenBytecode,
    args: ["Test USDT", "USDT", evmClient.account.address]
  });
  
  console.log(`✅ USDT deployed: ${usdt.address}`);
  
  // Deploy CaretOrchestrator
  const orchestrator = await evmClient.deployContract({
    abi: CaretOrchestratorABI,
    bytecode: CaretOrchestratorBytecode,
    args: [evmClient.account.address, usdt.address]
  });
  
  console.log(`✅ Orchestrator deployed: ${orchestrator.address}`);
  
  // Update definitions.ts with addresses
  await updateDefinitions({
    USDT: { address: usdt.address },
    CaretOrchestrator: { address: orchestrator.address }
  });
}
```

### 4. Contract Verification

```bash
# Verify contracts on Sei explorer
npx hardhat verify --network seiTestnet <contract_address> <constructor_args>

# Example
npx hardhat verify --network seiTestnet 0x742d35Cc6... "Test USDT" "USDT" 0x8A4F94b7D4...
```

---

## 🌐 Server Deployment

### 1. Development Server

```bash
# Start development server with hot reload
bun run server:dev

# Server will start on http://localhost:3000
# Telegram bot will be active and ready for testing
```

#### Development Features
- **Hot Reload**: Automatic restart on file changes
- **Debug Logging**: Detailed console output
- **Local Database**: SQLite file in `data/` directory
- **Testnet Contracts**: Uses Sei testnet for blockchain interactions

### 2. Production Deployment

#### Docker Deployment

```dockerfile
# Dockerfile
FROM oven/bun:1 as base

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY evm/package.json ./evm/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN cd evm && bun run compile && cd ..
RUN bun run db:generate

# Expose port
EXPOSE 3000

# Start application
CMD ["bun", "run", "src/server/index.ts"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  seitrader:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env.production
    volumes:
      - ./data:/app/data
      - ./cache:/app/cache
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - seitrader
    restart: unless-stopped
```

#### Production Environment

```bash
# .env.production
NODE_ENV=production
PORT=3000

# Production API keys
GOOGLE_API_KEY=prod_gemini_key
TG_BOT_TOKEN=prod_telegram_token
PVT_KEY=prod_private_key

# Database
DATABASE_URL=./data/production.sqlite

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=warn
```

### 3. Cloud Deployment

#### VPS Deployment (Ubuntu/Debian)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js and Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Clone and setup application
git clone https://github.com/your-org/seiTrader.git
cd seiTrader
bun install

# Setup systemd service
sudo cp deployment/seitrader.service /etc/systemd/system/
sudo systemctl enable seitrader
sudo systemctl start seitrader

# Setup reverse proxy
sudo apt install nginx
sudo cp deployment/nginx.conf /etc/nginx/sites-available/seitrader
sudo ln -s /etc/nginx/sites-available/seitrader /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

#### Systemd Service Configuration

```ini
# deployment/seitrader.service
[Unit]
Description=Sei Trader Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/seiTrader
ExecStart=/home/ubuntu/.bun/bin/bun run src/server/index.ts
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

#### Nginx Configuration

```nginx
# deployment/nginx.conf
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

---

## 📊 Monitoring & Maintenance

### 1. Health Monitoring

```bash
# Check server health
curl http://localhost:3000/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 86400
}
```

### 2. Logging Configuration

```typescript
// Configure logging levels
const logConfig = {
  development: "debug",
  test: "warn", 
  production: "info"
};

// Log rotation setup
const winston = require('winston');
require('winston-daily-rotate-file');

const logger = winston.createLogger({
  level: logConfig[process.env.NODE_ENV],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});
```

### 3. Database Maintenance

```bash
# Backup database
cp data/database.sqlite backups/database-$(date +%Y%m%d).sqlite

# Optimize database
sqlite3 data/database.sqlite "VACUUM;"

# Check database integrity
sqlite3 data/database.sqlite "PRAGMA integrity_check;"
```

### 4. Performance Monitoring

```typescript
// Performance metrics collection
interface SystemMetrics {
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
}

async function collectMetrics(): Promise<SystemMetrics> {
  return {
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage().user,
    activeConnections: server.connections,
    requestsPerMinute: requestCounter.getLastMinute(),
    errorRate: errorCounter.getRate()
  };
}
```

---

## 🔄 CI/CD Pipeline

### 1. GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Sei Trader

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
      - run: cd evm && bun run compile

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          ssh user@server 'cd /app && git pull && bun install && systemctl restart seitrader'
```

### 2. Automated Testing

```typescript
// tests/integration.test.ts
import { describe, it, expect } from "bun:test";
import { Agent } from "../src/bot/agent";

describe("AI Agent Integration", () => {
  it("should process trading queries", async () => {
    const agent = new Agent({
      model: "gemini-2.0-flash",
      preamble: "Test agent"
    });
    
    const result = await agent.enhancedWorkflow(
      "Should I buy WSEI?"
    );
    
    expect(result.guardResult.valid).toBe(true);
    expect(result.tickerResult?.ticker).toBe("WSEI");
  });
});
```

---

## 🔒 Security Considerations

### 1. Environment Security

```bash
# Secure environment variables
chmod 600 .env*

# Use encrypted secrets for production
gpg --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 \
    --s2k-digest-algo SHA512 --s2k-count 65536 \
    --symmetric --output .env.production.gpg .env.production
```

### 2. Network Security

```bash
# Firewall configuration
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000  # Block direct access to app
```

### 3. SSL/TLS Setup

```bash
# Install Certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🚨 Troubleshooting

### Common Issues

#### Bot Not Responding
```bash
# Check bot status
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe

# Check server logs
tail -f logs/application.log

# Restart bot
systemctl restart seitrader
```

#### Database Connection Issues
```bash
# Check database file permissions
ls -la data/database.sqlite

# Test database connection
sqlite3 data/database.sqlite ".tables"

# Reset database (last resort)
rm data/database.sqlite
bun run db:migrate
```

#### Smart Contract Issues
```bash
# Check contract deployment
curl -X POST https://evm-rpc-testnet.sei-apis.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["0xYOUR_CONTRACT_ADDRESS","latest"],"id":1}'

# Redeploy contracts
cd evm && bun run migrate
```

---

## 📈 Scaling Considerations

### 1. Horizontal Scaling

```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  seitrader:
    build: .
    deploy:
      replicas: 3
    environment:
      - INSTANCE_ID=${HOSTNAME}

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx-loadbalancer.conf:/etc/nginx/nginx.conf
```

### 2. Database Scaling

```typescript
// Database connection pooling
import { Database } from 'bun:sqlite';

class DatabasePool {
  private pools: Database[] = [];
  private maxConnections = 10;
  
  async getConnection(): Promise<Database> {
    // Connection pool implementation
  }
  
  async releaseConnection(db: Database): Promise<void> {
    // Return connection to pool
  }
}
```

---

This deployment guide provides comprehensive instructions for setting up and deploying Sei Trader in various environments, from local development to production scaling. Follow the security best practices and monitoring guidelines to ensure a robust deployment.
