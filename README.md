# Discord Shapes Bot

A Discord roleplay bot that integrates with the [Shapes.inc API](https://github.com/shapesinc/shapes-api) to bring AI-powered characters to your Discord server.

## Features

- 🎭 **Roleplay Integration**: Chat with AI characters from Shapes.inc
- 💬 **Natural Conversations**: Supports both direct messages and server channels
- 🧠 **Memory Management**: Long-term and short-term memory across conversations
- 🌐 **Web Search**: Characters can search the web for information
- 🎨 **Image Generation**: Generate images through character interactions
- 📊 **Dashboard Access**: Direct access to character configuration
- 🔄 **Memory Controls**: Reset and manage character memory

## Prerequisites

1. **Node.js** (version 16 or higher)
2. **Discord Bot Token** - Create a bot at [Discord Developer Portal](https://discord.com/developers/applications)
3. **Shapes.inc API Key** - Get your API key from [Shapes.inc](https://shapes.inc)
4. **Shape Username** - The username of your character on Shapes.inc

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Navigate to your project directory
cd rickbothost

# Install dependencies
npm install
```

### 2. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

2. Edit the `.env` file with your credentials:
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   SHAPESINC_API_KEY=your_shapes_api_key_here
   SHAPESINC_SHAPE_USERNAME=your_shape_username_here
   ```

### 3. Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application and bot
3. Copy the bot token to your `.env` file
4. Enable the following bot permissions:
   - Send Messages
   - Read Message History
   - Use Slash Commands
   - Embed Links
   - Attach Files
5. Invite the bot to your server using the OAuth2 URL generator

### 4. Shapes.inc Setup

1. Visit [Shapes.inc](https://shapes.inc) and create an account
2. Get your API key from the dashboard
3. Note your character's username
4. Add both to your `.env` file

## Running the Bot

### Development Mode (Local)
```bash
npm run dev
```

### Production Mode (Local)
```bash
npm start
```

### Deployment on Render

1. **Push to GitHub**: Make sure your code is in a GitHub repository
2. **Connect to Render**:
   - Go to [Render.com](https://render.com)
   - Sign up/login and connect your GitHub account
   - Click "New" → "Web Service"
   - Select your repository
3. **Configure Service**:
   - **Name**: `discord-shapes-bot` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)
4. **Set Environment Variables** in Render dashboard:
   - `DISCORD_TOKEN`: Your Discord bot token
   - `SHAPESINC_API_KEY`: Your Shapes.inc API key
   - `SHAPESINC_SHAPE_USERNAME`: Your shape username
   - `NODE_ENV`: `production`
5. **Deploy**: Render will automatically build and deploy your bot

#### Render Features:
- ✅ **Auto-deployment** from GitHub commits
- ✅ **Health monitoring** via `/health` endpoint
- ✅ **Environment variable management**
- ✅ **SSL certificates** and custom domains
- ✅ **Free tier** with 750 hours/month
- ✅ **Automatic sleep** after 15 minutes of inactivity (free tier)

#### Alternative: Using render.yaml
The project includes a `render.yaml` file for Infrastructure as Code deployment:
1. Push the `render.yaml` file to your repository
2. In Render dashboard, use "Blueprint" option
3. Connect your repository - Render will automatically configure the service

## Usage

### Basic Chat
Simply type a message in any channel where the bot has access, and it will respond as your Shapes.inc character.

### Commands

| Command | Description | Example |
|---------|-------------|---------|
| `!help` | Show available commands | `!help` |
| `!reset` | Reset character's long-term memory | `!reset` |
| `!sleep` | Generate long-term memory on demand | `!sleep` |
| `!dashboard` | Access character's dashboard | `!dashboard` |
| `!info` | Get character information | `!info` |
| `!web <query>` | Search the web | `!web latest news` |
| `!imagine <prompt>` | Generate images | `!imagine beautiful sunset` |
| `!wack` | Reset short-term memory | `!wack` |

### Features

- **Multi-Channel Support**: The bot maintains separate conversation contexts for different channels
- **User Identification**: Each Discord user gets a unique identifier for personalized interactions
- **Message Splitting**: Long responses are automatically split to fit Discord's message limits
- **Error Handling**: Graceful handling of API errors and rate limits
- **Typing Indicators**: Shows when the bot is processing a response

## Configuration

You can modify the bot's behavior by editing the `config` object in `bot.js`:

```javascript
const config = {
    shapeUsername: process.env.SHAPESINC_SHAPE_USERNAME,
    prefix: '!', // Command prefix
    maxMessageLength: 2000 // Discord message limit
};
```

## API Integration Details

This bot uses the Shapes.inc API with the following configuration:
- **Base URL**: `https://api.shapes.inc/v1/`
- **Model Format**: `shapesinc/<shape-username>`
- **Custom Headers**: 
  - `X-User-Id`: `discord_user_<discord_user_id>`
  - `X-Channel-Id`: `discord_channel_<guild_id>_<channel_id>`

## Troubleshooting

### Common Issues

1. **Bot doesn't respond**
   - Check if the bot has permission to read and send messages
   - Verify your Discord token is correct
   - Ensure the bot is online
   - On Render free tier: Bot may be sleeping, send a message to wake it up

2. **API errors**
   - Verify your Shapes.inc API key is valid
   - Check your shape username is correct
   - Ensure you haven't exceeded rate limits (20 RPM)

3. **Missing dependencies**
   - Run `npm install` to install all required packages
   - Make sure you're using Node.js version 16 or higher

4. **Render-specific issues**
   - **Bot goes offline**: Free tier sleeps after 15 minutes of inactivity
   - **Cold starts**: First message after sleep may take 10-30 seconds
   - **Solution**: Use the built-in keep-alive mechanism (see Keep-Alive section below)
   - **Alternative**: Upgrade to paid plan for guaranteed 24/7 uptime

### Error Messages

- `Authentication error`: Check your Shapes.inc API key
- `Rate limit exceeded`: Wait before sending more requests
- `Unknown command`: Use `!help` to see available commands

## Development

### Project Structure
```
rickbothost/
├── bot.js              # Main bot file with health check server
├── keep-alive.js       # Keep-alive utility for external monitoring
├── package.json        # Dependencies and scripts
├── render.yaml         # Render deployment configuration
├── .env.example        # Environment variables template
├── .env               # Your environment variables (create this)
├── .gitignore         # Git ignore file
└── README.md          # This file
```

### Health Check Endpoint
The bot includes a health check server that runs on port 3000 (or PORT environment variable):
- **Endpoint**: `/health`
- **Response**: JSON with bot status, uptime, and timestamp
- **Purpose**: Required for Render monitoring and deployment
- **Note**: Render's free tier sleeps after 15 minutes of inactivity, health checks help keep it alive

### Adding New Features

To add new commands, modify the command switch statement in `bot.js`:

```javascript
case 'newcommand':
    // Your command logic here
    break;
```

## Keep-Alive Solutions

To keep your Discord bot running 24/7 on Render's free tier, you have several options:

### 1. Built-in Self-Ping (Recommended)
The bot includes an automatic self-ping mechanism that activates in production:

- **How it works**: Pings itself every 14 minutes to prevent sleeping
- **Setup**: Automatically enabled when `NODE_ENV=production`
- **Requirements**: `RENDER_EXTERNAL_URL` environment variable (auto-set by render.yaml)
- **Logs**: Check Render logs for ping status messages

### 2. External Monitoring Services
Use free monitoring services to ping your bot:

#### UptimeRobot (Free)
1. Sign up at [UptimeRobot.com](https://uptimerobot.com)
2. Create HTTP(s) monitor
3. URL: `https://your-app.onrender.com/health`
4. Interval: 5-15 minutes
5. Free plan: 50 monitors, 5-minute intervals

#### Pingdom (Free tier)
1. Sign up at [Pingdom.com](https://pingdom.com)
2. Create uptime check
3. URL: `https://your-app.onrender.com/health`
4. Free plan: 1 check, 1-minute intervals

#### StatusCake (Free)
1. Sign up at [StatusCake.com](https://statuscake.com)
2. Create uptime test
3. URL: `https://your-app.onrender.com/health`
4. Free plan: 10 tests, 5-minute intervals

### 3. Cron Job Services
Use free cron job services:

#### cron-job.org (Free)
1. Sign up at [cron-job.org](https://cron-job.org)
2. Create new cron job
3. URL: `https://your-app.onrender.com/health`
4. Schedule: `*/14 * * * *` (every 14 minutes)
5. Free plan: 3 jobs

#### EasyCron (Free)
1. Sign up at [EasyCron.com](https://easycron.com)
2. Create cron job
3. URL: `https://your-app.onrender.com/health`
4. Expression: `*/14 * * * *`
5. Free plan: 1 job

### 4. GitHub Actions (Free)
Create a GitHub Action to ping your bot:

```yaml
# .github/workflows/keep-alive.yml
name: Keep Bot Alive
on:
  schedule:
    - cron: '*/14 * * * *'  # Every 14 minutes
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Bot
        run: |
          curl -f https://your-app.onrender.com/health || exit 1
```

### 5. Manual Keep-Alive Script
Use the included `keep-alive.js` script:

```bash
# Single ping
node keep-alive.js https://your-app.onrender.com

# Continuous monitoring
node -e "require('./keep-alive').startContinuousPing('https://your-app.onrender.com')"
```

### Environment Variables for Keep-Alive

```env
# Enable keep-alive (auto-enabled in production)
KEEP_ALIVE=true

# Your Render app URL (auto-set by render.yaml)
RENDER_EXTERNAL_URL=https://your-app.onrender.com
```

### Monitoring Your Bot

Check if keep-alive is working:
1. **Render Logs**: Look for "Keep-alive ping" messages
2. **Health Endpoint**: Visit `https://your-app.onrender.com/health`
3. **Discord**: Bot should stay online consistently
4. **Response Time**: First message after potential sleep should be fast

## Support

- **Shapes.inc API Documentation**: [GitHub Repository](https://github.com/shapesinc/shapes-api)
- **Discord.js Documentation**: [Discord.js Guide](https://discordjs.guide/)
- **Discord Developer Portal**: [Discord Developers](https://discord.com/developers/docs/)
- **Render Documentation**: [Render Docs](https://render.com/docs)

## License

MIT License - feel free to modify and distribute as needed.