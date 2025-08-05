const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { OpenAI } = require('openai');
const http = require('http');
require('dotenv').config();

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

// Initialize Shapes.inc API client
const shapesClient = new OpenAI({
    apiKey: process.env.SHAPESINC_API_KEY,
    baseURL: "https://api.shapes.inc/v1/",
});

// Bot configuration
const config = {
    shapeUsername: process.env.SHAPESINC_SHAPE_USERNAME,
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
function splitMessage(text, maxLength = config.maxMessageLength) {
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
async function getShapeResponse(message, userMessage) {
    try {
        const contextKey = getContextKey(message);
        const userId = `discord_user_${message.author.id}`;
        const channelId = `discord_channel_${contextKey}`;
        
        // Create a new client instance with custom headers for this request
        const shapesClientWithHeaders = new OpenAI({
            apiKey: process.env.SHAPESINC_API_KEY,
            baseURL: "https://api.shapes.inc/v1/",
            defaultHeaders: {
                'X-User-Id': userId,
                'X-Channel-Id': channelId
            }
        });
        
        const response = await shapesClientWithHeaders.chat.completions.create({
            model: `shapesinc/${config.shapeUsername}`,
            messages: [
                { role: "user", content: userMessage }
            ]
        });
        
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error calling Shapes API:', error);
        
        if (error.status === 401) {
            return 'Authentication error. Please check the API key configuration.';
        } else if (error.status === 429) {
            return 'Rate limit exceeded. Please try again later.';
        } else {
            return 'Sorry, I encountered an error while processing your message. Please try again.';
        }
    }
}

// Bot ready event
client.once('ready', () => {
    console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
    console.log(`🤖 Using shape: ${config.shapeUsername}`);
    
    // Set bot status
    client.user.setActivity('Roleplay with Shapes.inc', { type: 'PLAYING' });
});

// Message event handler
client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Handle commands
    if (message.content.startsWith(config.prefix)) {
        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        
        switch (command) {
            case 'help':
                const helpEmbed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('🎭 Roleplay Bot Commands')
                    .setDescription('Commands for interacting with your Shapes.inc character')
                    .addFields(
                        { name: '💬 Chat', value: 'Just type a message to chat with the character', inline: false },
                        { name: '🔄 !reset', value: 'Reset the character\'s long-term memory', inline: true },
                        { name: '😴 !sleep', value: 'Generate long-term memory on demand', inline: true },
                        { name: '📊 !dashboard', value: 'Access the character\'s dashboard', inline: true },
                        { name: 'ℹ️ !info', value: 'Get information about the character', inline: true },
                        { name: '🌐 !web', value: 'Search the web (e.g., !web cats)', inline: true },
                        { name: '🎨 !imagine', value: 'Generate images (e.g., !imagine sunset)', inline: true },
                        { name: '🧠 !wack', value: 'Reset short-term memory', inline: true },
                        { name: '❓ !help', value: 'Show this help message', inline: true }
                    )
                    .setFooter({ text: 'Powered by Shapes.inc API' });
                
                await message.reply({ embeds: [helpEmbed] });
                break;
                
            case 'reset':
            case 'sleep':
            case 'dashboard':
            case 'info':
            case 'wack':
                // Pass command directly to Shapes API
                const commandResponse = await getShapeResponse(message, `!${command}`);
                const commandMessages = splitMessage(commandResponse);
                
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
                const webResponse = await getShapeResponse(message, `!web ${webQuery}`);
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
                const imageResponse = await getShapeResponse(message, `!imagine ${imagePrompt}`);
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
    
    // Handle regular chat messages
    try {
        // Show typing indicator
        await message.channel.sendTyping();
        
        // Get response from Shapes API
        const response = await getShapeResponse(message, message.content);
        
        // Split long responses and send
        const messages = splitMessage(response);
        
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