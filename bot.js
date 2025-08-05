import { config } from 'dotenv';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import OpenAI from 'openai';
import http from 'http';
import { getApiBaseUrl } from './utils.js';
import chalk from 'chalk';

config();

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

// Initialize Shapes client with official utilities
let shapesClient;
let shapeUsername = process.env.SHAPESINC_SHAPE_USERNAME || 'shaperobot';
let shapeAppId = process.env.SHAPESINC_APP_ID || 'f6263f80-2242-428d-acd4-10e1feec44ee';

// Initialize the Shapes client with auto-discovery
async function initializeShapesClient() {
    const apiUrl = await getApiBaseUrl();
    console.log(chalk.magenta('→ Shapes API URL:'), apiUrl);
    console.log(chalk.magenta('→ Shape Username:'), shapeUsername);
    console.log(chalk.magenta('→ App ID:'), shapeAppId);
    
    shapesClient = new OpenAI({
        apiKey: process.env.SHAPESINC_API_KEY,
        baseURL: apiUrl,
    });
}

// Bot configuration
const botConfig = {
    prefix: '!', // Command prefix
    maxMessageLength: 2000, // Discord message limit
    keepAlive: process.env.KEEP_ALIVE === 'true' || process.env.NODE_ENV === 'production'
};

// Store conversation contexts
const conversationContexts = new Map();

// Helper function to get conversation context key
function getContextKey(message) {
    return message.guild ? `${message.guild.id}_${message.channel.id}` : `dm_${message.author.id}`;
}

// Helper function to split long messages
function splitMessage(text, maxLength = botConfig.maxMessageLength) {
    if (text.length <= maxLength) return [text];
    
    const messages = [];
    let currentMessage = '';
    
    const lines = text.split('\n');
    for (const line of lines) {
        if ((currentMessage + line + '\n').length > maxLength) {
            if (currentMessage) {
                messages.push(currentMessage.trim());
                currentMessage = '';
            }
            
            if (line.length > maxLength) {
                // Split very long lines
                for (let i = 0; i < line.length; i += maxLength) {
                    messages.push(line.slice(i, i + maxLength));
                }
            } else {
                currentMessage = line + '\n';
            }
        } else {
            currentMessage += line + '\n';
        }
    }
    
    if (currentMessage.trim()) {
        messages.push(currentMessage.trim());
    }
    
    return messages;
}

// Function to interact with Shapes.inc API


// Bot ready event
client.once('ready', async () => {
    console.log(chalk.green(`✅ Bot is ready! Logged in as ${client.user.tag}`));
    console.log(chalk.green(`🤖 Using shape: ${shapeUsername}`));
    
    // Initialize Shapes client
    await initializeShapesClient();
    
    // Set bot status
    client.user.setActivity('Roleplay with Shapes.inc', { type: 'PLAYING' });
});

// Message event handler
client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Handle commands
    if (message.content.startsWith(botConfig.prefix)) {
        const args = message.content.slice(botConfig.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        
        switch (command) {
            case 'help':
                const headers = {
                    'X-User-Id': message.author.id,
                    'X-Channel-Id': message.channel.id,
                };
                
                const helpResponse = await shapesClient.chat.completions.create({
                    model: `shapesinc/${shapeUsername}`,
                    messages: [{ role: 'user', content: `!${command}` }],
                    headers: headers,
                });
                
                const commandResponse = helpResponse.choices[0]?.message?.content || 'Help command failed.';
                const helpMessages = splitMessage(commandResponse);
                
                for (const msg of helpMessages) {
                    await message.reply(msg);
                }
                break;
                
            case 'reset':
            case 'sleep':
            case 'dashboard':
            case 'info':
            case 'wack':
                // Pass command directly to Shapes API
                const cmdHeaders = {
                    'X-User-Id': message.author.id,
                    'X-Channel-Id': message.channel.id,
                };
                
                const cmdResponse = await shapesClient.chat.completions.create({
                    model: `shapesinc/${shapeUsername}`,
                    messages: [{ role: 'user', content: `!${command}` }],
                    headers: cmdHeaders,
                });
                
                const cmdResponseContent = cmdResponse.choices[0]?.message?.content || 'Command failed.';
                const commandMessages = splitMessage(cmdResponseContent);
                
                for (const msg of commandMessages) {
                    await message.reply(msg);
                }
                break;
                
            case 'web':
                if (args.length === 0) {
                    await message.reply('Please provide a search query. Example: `!web cats`');
                    return;
                }
                const webQuery = args.join(' ');
                const webHeaders = {
                    'X-User-Id': message.author.id,
                    'X-Channel-Id': message.channel.id,
                };
                
                const webApiResponse = await shapesClient.chat.completions.create({
                    model: `shapesinc/${shapeUsername}`,
                    messages: [{ role: 'user', content: `!web ${webQuery}` }],
                    headers: webHeaders,
                });
                
                const webResponse = webApiResponse.choices[0]?.message?.content || 'Web search failed.';
                const webMessages = splitMessage(webResponse);
                
                for (const msg of webMessages) {
                    await message.reply(msg);
                }
                break;
                
            case 'imagine':
                if (args.length === 0) {
                    await message.reply('Please provide an image description. Example: `!imagine beautiful sunset`');
                    return;
                }
                const imagePrompt = args.join(' ');
                const imageHeaders = {
                    'X-User-Id': message.author.id,
                    'X-Channel-Id': message.channel.id,
                };
                
                const imageApiResponse = await shapesClient.chat.completions.create({
                    model: `shapesinc/${shapeUsername}`,
                    messages: [{ role: 'user', content: `!imagine ${imagePrompt}` }],
                    headers: imageHeaders,
                });
                
                const imageResponse = imageApiResponse.choices[0]?.message?.content || 'Image generation failed.';
                const imageMessages = splitMessage(imageResponse);
                
                for (const msg of imageMessages) {
                    await message.reply(msg);
                }
                break;
                
            default:
                await message.reply(`Unknown command: \`${command}\`. Use \`!help\` to see available commands.`);
        }
        
        return;
    }
    
    // Check if bot is mentioned or if it's a DM
    const isMentioned = message.mentions.has(client.user);
    const isDM = message.channel.type === 'DM';
    
    // Only respond to mentions or DMs
    if (!isMentioned && !isDM) {
        return;
    }
    
    // Handle regular chat messages
    try {
        // Show typing indicator
        await message.channel.sendTyping();
        
        // Clean message content (remove bot mention if present)
        let cleanContent = message.content;
        if (isMentioned) {
            cleanContent = message.content.replace(/<@!?\d+>/g, '').trim();
        }
        
        // Set up headers for user identification and conversation context
        const headers = {
            'X-User-Id': message.author.id, // Discord user ID for user identification
            'X-Channel-Id': message.channel.id, // Discord channel ID for conversation context
        };

        const response = await shapesClient.chat.completions.create({
            model: `shapesinc/${shapeUsername}`,
            messages: [
                {
                    role: 'user',
                    content: cleanContent
                }
            ],
            headers: headers,
        });

        const aiResponse = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
        
        // Split long responses and send
        const messages = splitMessage(aiResponse);
        
        for (let i = 0; i < messages.length; i++) {
            if (i === 0) {
                await message.reply(messages[i]);
            } else {
                await message.channel.send(messages[i]);
            }
        }
        
    } catch (error) {
        console.error('Error handling message:', error);
        await message.reply('Sorry, I encountered an error while processing your message. Please try again.');
    }
});

// Error handling
client.on('error', (error) => {
    console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});

// Health check server for Cyclic
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'healthy', 
            bot: client.user ? client.user.tag : 'not ready',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 Health check server running on port ${PORT}`);
    
    // Keep-alive mechanism for free hosting services
    if (config.keepAlive) {
        const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
        if (RENDER_URL) {
            console.log('🔄 Keep-alive mechanism enabled');
            
            // Self-ping every 14 minutes to prevent sleeping
            setInterval(() => {
                const https = require('https');
                const http = require('http');
                const client = RENDER_URL.startsWith('https') ? https : http;
                
                const req = client.get(`${RENDER_URL}/health`, (res) => {
                    console.log(`⏰ Keep-alive ping: ${res.statusCode} at ${new Date().toISOString()}`);
                }).on('error', (err) => {
                    console.log(`❌ Keep-alive ping failed: ${err.message}`);
                });
                
                req.setTimeout(10000, () => {
                    req.destroy();
                    console.log('⚠️ Keep-alive ping timeout');
                });
            }, 14 * 60 * 1000); // 14 minutes
        } else {
            console.log('⚠️ RENDER_EXTERNAL_URL not set, keep-alive disabled');
        }
    }
});

// Login to Discord
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN is not set in environment variables');
    process.exit(1);
}

if (!process.env.SHAPESINC_API_KEY) {
    console.error('❌ SHAPESINC_API_KEY is not set in environment variables');
    process.exit(1);
}

if (!process.env.SHAPESINC_SHAPE_USERNAME) {
    console.error('❌ SHAPESINC_SHAPE_USERNAME is not set in environment variables');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);

console.log('🚀 Starting Discord Shapes Bot...');
console.log('📝 Make sure to set up your .env file with the required tokens and API keys.');