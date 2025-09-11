require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

// Click game state stored in memory
let gameState = {
    isActive: false,
    players: {},
    round: 0,
    host: null,
    channelId: null,
    roundClicks: {},
    nextRoundScheduled: false
};

// Roast generation function
function generateRoast() {
    const roasts = [
        "looks like they were assembled by someone having a seizure.",
        "has the sex appeal of a wet sock filled with chunky peanut butter.",
        "probably peaked in high school and it's been downhill since.",
        "looks like they'd disappoint their parents even if they cured cancer.",
        "has the personality of stale bread and half the charisma.",
        "looks like they'd get rejected by a mail-order bride.",
        "probably masturbates to their own LinkedIn profile picture.",
        "has the dating prospects of a registered offender at a playground.",
        "looks like they smell like disappointment and broken dreams.",
        "probably gets nervous ordering pizza over the phone.",
        "has the backbone of a chocolate eclair in a sauna.",
        "looks like they'd lose a popularity contest to a tumor.",
        "probably cries after sex... alone.",
        "has the confidence of a virgin at a strip club.",
        "looks like they'd get friendzoned by their own hand.",
        "probably thinks missionary is too kinky.",
        "has the charm of a funeral director with a stutter.",
        "looks like they'd apologize to a vending machine for taking their money.",
        "probably still asks their mom to cut their food.",
        "has the social skills of a lobotomized goldfish."
    ];
    return roasts[Math.floor(Math.random() * roasts.length)];
}

// Command definitions
const commands = [
    {
        name: 'roast',
        description: 'Roast a member (adult humor - use with caution!)',
        options: [
            {
                name: 'member',
                type: 6,
                description: 'The member to roast',
                required: true
            }
        ]
    },
    {
        name: 'bitchslap',
        description: "Bitch slap someone with a comical 'I'm your daddy' message",
        options: [
            {
                name: 'member',
                type: 6,
                description: 'The member to slap',
                required: true
            }
        ]
    },
    {
        name: 'serverinfo',
        description: 'Get detailed server information'
    },
    {
        name: 'timeout',
        description: 'Timeout a member',
        options: [
            {
                name: 'member',
                type: 6,
                description: 'The member to timeout',
                required: true
            },
            {
                name: 'duration',
                type: 4,
                description: 'Timeout duration in minutes',
                required: true
            },
            {
                name: 'reason',
                type: 3,
                description: 'Reason for timeout',
                required: false
            }
        ]
    },
    {
        name: 'ban',
        description: 'Ban a member from the server',
        options: [
            {
                name: 'member',
                type: 6,
                description: 'The member to ban',
                required: true
            },
            {
                name: 'reason',
                type: 3,
                description: 'Reason for ban',
                required: false
            }
        ]
    },
    {
        name: 'changenickname',
        description: 'Change a members nickname',
        options: [
            {
                name: 'member',
                type: 6,
                description: 'The member to rename',
                required: true
            },
            {
                name: 'nickname',
                type: 3,
                description: 'New nickname',
                required: true
            }
        ]
    },
    {
        name: 'addrole',
        description: 'Add a role to a member',
        options: [
            {
                name: 'member',
                type: 6,
                description: 'The member to add role to',
                required: true
            },
            {
                name: 'role',
                type: 8,
                description: 'The role to add',
                required: true
            }
        ]
    },
    {
        name: 'startclickgame',
        description: 'Start the Trouble Syndicate Click Game'
    },
    {
        name: 'cancelclickgame',
        description: 'Cancel the current click game'
    }
];

client.once('ready', async () => {
    console.log(`Bot is ready! Logged in as ${client.user.tag}`);
    
    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
        console.log('Started refreshing application (/) commands.');
        
        // Force clear ALL global commands
        console.log('Clearing all global commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: [] }
        );
        
        // Clear guild-specific commands for all guilds the bot is in
        console.log('Clearing guild-specific commands...');
        for (const guild of client.guilds.cache.values()) {
            try {
                await rest.put(
                    Routes.applicationGuildCommands(client.user.id, guild.id),
                    { body: [] }
                );
                console.log(`Cleared commands for guild: ${guild.name}`);
            } catch (guildError) {
                console.log(`Could not clear commands for guild ${guild.name}:`, guildError.message);
            }
        }
        
        // Wait a moment for Discord to process the deletions
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Now register only the current commands globally
        console.log('Registering new commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        
        console.log('Successfully registered application (/) commands.');
        console.log(`Registered ${commands.length} commands:`, commands.map(c => c.name).join(', '));
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

    // Handle slash commands
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;

        switch (commandName) {
        case 'roast':
            const targetMember = interaction.options.getMember('member');
            
            if (!targetMember) {
                return interaction.reply({ content: '❌ Could not find that member!', ephemeral: true });
            }
            
            const roast = generateRoast();
            
            if (targetMember.id === interaction.user.id) {
                await interaction.reply(`🔥 <@${targetMember.id}> just roasted themselves! They ${roast} 💀`);
            } else {
                await interaction.reply(`🔥 <@${targetMember.id}> ${roast} 😈\n\n*Brutal but true! 🔥*`);
            }
            break;

        case 'bitchslap':
            const slapTarget = interaction.options.getMember('member');
            
            if (!slapTarget) {
                return interaction.reply({ content: '❌ Could not find that member!', ephemeral: true });
            }
            
            const slapMessages = [
                `slapped the shit out of <@${slapTarget.id}> and said "I'm your daddy now, bitch!" 👋💥`,
                `bitch slapped <@${slapTarget.id}> so hard they forgot their own name! "Who's your daddy?" 👋😈`,
                `delivered a reality check slap to <@${slapTarget.id}>! "I'm your daddy, deal with it!" 👋🔥`,
                `slapped <@${slapTarget.id}> into next week! "Say my name - I'm your daddy!" 👋💀`,
                `gave <@${slapTarget.id}> a wake-up slap! "Daddy's home, bitch!" 👋⚡`
            ];
            const randomSlap = slapMessages[Math.floor(Math.random() * slapMessages.length)];
            
            if (slapTarget.id === interaction.user.id) {
                await interaction.reply(`💥 <@${interaction.user.id}> just slapped themselves! Self-discipline! "I'm my own daddy!" 👋😂`);
            } else {
                await interaction.reply(`💥 <@${interaction.user.id}> ${randomSlap}`);
            }
            break;

        case 'serverinfo':
            const guild = interaction.guild;
            
            if (!guild) {
                return interaction.reply({ content: '❌ This command can only be used in a server!', ephemeral: true });
            }
            
            const embed = {
                color: 0x0099FF,
                title: `Server Information: ${guild.name}`,
                fields: [
                    { name: 'Members', value: guild.memberCount.toString(), inline: true },
                    { name: 'Created', value: guild.createdAt.toDateString(), inline: true },
                    { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
                    { name: 'Roles', value: guild.roles.cache.size.toString(), inline: true },
                    { name: 'Channels', value: guild.channels.cache.size.toString(), inline: true },
                    { name: 'Server ID', value: guild.id, inline: true }
                ],
                thumbnail: {
                    url: guild.iconURL() || 'https://via.placeholder.com/128'
                },
                timestamp: new Date().toISOString()
            };
            await interaction.reply({ embeds: [embed] });
            break;

        case 'timeout':
            const timeoutMember = interaction.options.getMember('member');
            const duration = interaction.options.getInteger('duration');
            const timeoutReason = interaction.options.getString('reason') || 'No reason provided';
            
            if (!interaction.member.permissions.has('ModerateMembers')) {
                return interaction.reply({ content: '❌ You do not have permission to timeout members!', ephemeral: true });
            }
            
            if (timeoutMember.id === interaction.user.id) {
                return interaction.reply({ content: '❌ You cannot timeout yourself!', ephemeral: true });
            }
            
            try {
                await timeoutMember.timeout(duration * 60 * 1000, timeoutReason);
                await interaction.reply(`⏰ **${timeoutMember.displayName}** has been timed out for ${duration} minutes.\n**Reason:** ${timeoutReason}`);
            } catch (error) {
                await interaction.reply({ content: '❌ Failed to timeout member. Check my permissions!', ephemeral: true });
            }
            break;

        case 'ban':
            const banMember = interaction.options.getMember('member');
            const banReason = interaction.options.getString('reason') || 'No reason provided';
            
            if (!interaction.member.permissions.has('BanMembers')) {
                return interaction.reply({ content: '❌ You do not have permission to ban members!', ephemeral: true });
            }
            
            if (banMember.id === interaction.user.id) {
                return interaction.reply({ content: '❌ You cannot ban yourself!', ephemeral: true });
            }
            
            try {
                await banMember.ban({ reason: banReason });
                await interaction.reply(`🔨 **${banMember.displayName}** has been banned from the server.\n**Reason:** ${banReason}`);
            } catch (error) {
                await interaction.reply({ content: '❌ Failed to ban member. Check my permissions!', ephemeral: true });
            }
            break;

        case 'changenickname':
            const nickMember = interaction.options.getMember('member');
            const newNickname = interaction.options.getString('nickname');
            
            if (!interaction.member.permissions.has('ManageNicknames')) {
                return interaction.reply({ content: '❌ You do not have permission to change nicknames!', ephemeral: true });
            }
            
            try {
                const oldNickname = nickMember.displayName;
                await nickMember.setNickname(newNickname);
                await interaction.reply(`✏️ Changed **${oldNickname}**'s nickname to **${newNickname}**`);
            } catch (error) {
                await interaction.reply({ content: '❌ Failed to change nickname. Check my permissions!', ephemeral: true });
            }
            break;

        case 'addrole':
            const roleMember = interaction.options.getMember('member');
            const roleToAdd = interaction.options.getRole('role');
            
            if (!interaction.member.permissions.has('ManageRoles')) {
                return interaction.reply({ content: '❌ You do not have permission to manage roles!', ephemeral: true });
            }
            
            if (roleMember.roles.cache.has(roleToAdd.id)) {
                return interaction.reply({ content: `❌ **${roleMember.displayName}** already has the **${roleToAdd.name}** role!`, ephemeral: true });
            }
            
            try {
                await roleMember.roles.add(roleToAdd);
                await interaction.reply(`✅ Added the **${roleToAdd.name}** role to **${roleMember.displayName}**`);
            } catch (error) {
                await interaction.reply({ content: '❌ Failed to add role. Check my permissions!', ephemeral: true });
            }
            break;

        case 'startclickgame':
            if (gameState.isActive) {
                return interaction.reply({ 
                    content: '❌ A game is already active! Wait for it to finish first.', 
                    ephemeral: true 
                });
            }

            // Initialize new game state
            gameState = {
                isActive: true,
                players: {},
                round: 0,
                host: interaction.user.id,
                channelId: interaction.channelId,
                roundClicks: {},
                nextRoundScheduled: false
            };

            const joinRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('join_game')
                    .setLabel('Join Game')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('start_game')
                    .setLabel('Start Game')
                    .setStyle(ButtonStyle.Success)
            );

            await interaction.reply({ 
                content: `🌀 **Trouble Syndicate CLICK GAME** has begun!\n\n` +
                        `📋 **Rules:**\n` +
                        `• Everyone starts with 10 lives\n` +
                        `• Each round has 3 buttons: Safe, Gain Life (+1), Lose Life (-1)\n` +
                        `• Each player can only click once per round\n` +
                        `• Rounds auto-advance after 6 seconds\n` +
                        `• Special events may occur randomly\n` +
                        `• Last player standing wins!\n\n` +
                        `👥 **Players Joined: 0** (Need at least 2 to start)\n\n` +
                        `Click "Join Game" to enter. Host <@${gameState.host}> can start when ready.`, 
                components: [joinRow] 
            });
            break;

        case 'cancelclickgame':
            if (!gameState.isActive) {
                return interaction.reply({ 
                    content: '❌ No active game to cancel!', 
                    ephemeral: true
                });
            }

            // Reset game state
            gameState = {
                isActive: false,
                players: {},
                round: 0,
                host: null,
                channelId: null,
                roundClicks: {},
                nextRoundScheduled: false
            };

            await interaction.reply({ 
                content: `🛑 **Game Cancelled!**\n\nThe Trouble Syndicate Click Game has been stopped. You can start a new game anytime with \`/startclickgame\`.`
            });
            break;
            
        default:
            await interaction.reply('🔥 Use `/roast @someone` to unleash heat, `/bitchslap @someone` for comedy, or `/startclickgame` to play!');
        }
    }

    // Handle button interactions
    if (interaction.isButton()) {
        const userId = interaction.user.id;

        if (interaction.customId === 'join_game') {
            if (!gameState.isActive) {
                return interaction.reply({ 
                    content: '❌ No active game to join!', 
                    ephemeral: true
                });
            }

            if (!gameState.players[userId]) {
                gameState.players[userId] = { 
                    lives: 10, 
                    username: interaction.user.username 
                };
                
                const playerCount = Object.keys(gameState.players).length;
                const playerList = Object.values(gameState.players)
                    .map(player => `• ${player.username}`)
                    .join('\n');
                
                await interaction.reply({ 
                    content: `✅ **${interaction.user.username}** joined the game with 10 lives!\n\n` +
                            `👥 **Players Joined: ${playerCount}**\n${playerList}\n\n` +
                            `${playerCount >= 2 ? '🎮 Ready to start!' : '⏳ Need at least 2 players to start'}`, 
                    ephemeral: true
                });
                
                // Send updated player list to channel
                const channel = client.channels.cache.get(gameState.channelId);
                if (channel) {
                    await channel.send({
                        content: `✅ **${interaction.user.username}** joined! **${playerCount} players** total:\n${playerList}\n\n${playerCount >= 2 ? '🎮 Ready to start!' : '⏳ Need at least 2 players to start'}`
                    });
                }
            } else {
                await interaction.reply({ 
                    content: `❌ You're already in the game!`, 
                    ephemeral: true
                });
            }
        }

        if (interaction.customId === 'start_game') {
            if (!gameState.isActive) {
                return interaction.reply({ 
                    content: '❌ No active game to start!', 
                    ephemeral: true
                });
            }

            if (userId !== gameState.host) {
                return interaction.reply({ 
                    content: '❌ Only the host can start the game!', 
                    ephemeral: true
                });
            }

            const playerCount = Object.keys(gameState.players).length;
            if (playerCount < 2) {
                return interaction.reply({ 
                    content: '❌ Need at least 2 players to start!', 
                    ephemeral: true
                });
            }

            gameState.round = 1;
            gameState.roundClicks = {};
            gameState.nextRoundScheduled = false;
            await interaction.reply({ content: `🎮 **Game Started!** Round 1 begins now!\n⏰ Each round lasts 6 seconds - click fast!` });
            await startRound(interaction);
        }

        if (interaction.customId.startsWith('click_')) {
            await handleClick(interaction);
        }

        if (interaction.customId === 'trade_souls') {
            await handleSoulTrade(interaction);
        }

        if (interaction.customId === 'rejoin_lottery') {
            await handleRejoin(interaction);
        }
    }
});

// Click Game Functions
async function startRound(interaction) {
    if (!gameState.isActive) return;

    // Show current standings
    const standings = Object.entries(gameState.players)
        .filter(([_, player]) => player.lives > 0)
        .sort((a, b) => b[1].lives - a[1].lives)
        .map(([userId, player], index) => 
            `${index + 1}. <@${userId}> - ${player.lives} lives`
        )
        .join('\n');

    // Alternate button layouts between odd and even rounds
    const roundType = gameState.round % 2 === 1 ? 
        ['safe', 'gain', 'lose'] : 
        ['gain', 'lose', 'safe'];
    
    // Shuffle the button order randomly
    const shuffled = [...roundType].sort(() => Math.random() - 0.5);

    const row = new ActionRowBuilder().addComponents(
        shuffled.map((type) =>
            new ButtonBuilder()
                .setCustomId(`click_${type}`)
                .setLabel(`Click Me`)
                .setStyle(ButtonStyle.Secondary)
        )
    );

    const roundMessage = `🎲 **Round ${gameState.round}** — Choose your fate!\n\n` +
                        `📊 **Current Standings:**\n${standings}\n\n` +
                        `⚡ Click one of the buttons below (6 seconds to choose):`;

    await interaction.followUp({ 
        content: roundMessage, 
        components: [row] 
    });
    
    // Start 6-second timer for this round
    setTimeout(async () => {
        if (gameState.isActive && gameState.round > 0) {
            await forceNextRound();
        }
    }, 6000);

    // Random soul trade event (20% chance)
    if (Math.random() < 0.2 && gameState.round > 3) {
        const tradeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('trade_souls')
                .setLabel('💀 TRADE SOULS')
                .setStyle(ButtonStyle.Danger)
        );
        
        setTimeout(async () => {
            await interaction.followUp({ 
                content: `💀 **SOUL TRADE ACTIVATED!**\n` +
                        `First player to click will swap lives with the player who has the most lives!`, 
                components: [tradeRow] 
            });
        }, 2000);
    }

    // Rejoin lottery at round 20
    if (gameState.round === 20) {
        const rejoinRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('rejoin_lottery')
                .setLabel('🎰 REJOIN LOTTERY')
                .setStyle(ButtonStyle.Success)
        );
        
        setTimeout(async () => {
            await interaction.followUp({ 
                content: `🎰 **REJOIN LOTTERY ACTIVATED!**\n` +
                        `First eliminated player to click gets back in with 5 lives!`, 
                components: [rejoinRow] 
            });
        }, 3000);
    }

    gameState.round++;
}

async function startNewRound(channel) {
    if (!gameState.isActive) return;

    // Show current standings
    const standings = Object.entries(gameState.players)
        .filter(([_, player]) => player.lives > 0)
        .sort((a, b) => b[1].lives - a[1].lives)
        .map(([userId, player], index) => 
            `${index + 1}. <@${userId}> - ${player.lives} lives`
        )
        .join('\n');

    // Alternate button layouts between odd and even rounds
    const roundType = gameState.round % 2 === 1 ? 
        ['safe', 'gain', 'lose'] : 
        ['gain', 'lose', 'safe'];
    
    // Shuffle the button order randomly
    const shuffled = [...roundType].sort(() => Math.random() - 0.5);

    const row = new ActionRowBuilder().addComponents(
        shuffled.map((type) =>
            new ButtonBuilder()
                .setCustomId(`click_${type}`)
                .setLabel(`Click Me`)
                .setStyle(ButtonStyle.Secondary)
        )
    );

    const roundMessage = `🎲 **Round ${gameState.round}** — Choose your fate!\n\n` +
                        `📊 **Current Standings:**\n${standings}\n\n` +
                        `⚡ Click one of the buttons below (6 seconds to choose):`;

    await channel.send({ 
        content: roundMessage, 
        components: [row] 
    });
    
    // Start 6-second timer for this round
    setTimeout(async () => {
        if (gameState.isActive && gameState.round > 0) {
            await forceNextRound();
        }
    }, 6000);

    gameState.round++;
}

async function handleClick(interaction) {
    const userId = interaction.user.id;
    const player = gameState.players[userId];
    
    // Quick validation before deferring
    if (!gameState.isActive) {
        return interaction.reply({ 
            content: '❌ No active game!',
            ephemeral: true
        });
    }
    
    if (!player) {
        return interaction.reply({ 
            content: '❌ You are not in this game!',
            ephemeral: true
        });
    }
    
    if (player.lives <= 0) {
        return interaction.reply({ 
            content: '💀 You are eliminated! You have no lives left.',
            ephemeral: true
        });
    }

    // Check if player already clicked this round
    if (gameState.roundClicks[userId]) {
        return interaction.reply({
            content: '❌ You already clicked this round! Wait for the next round.',
            ephemeral: true
        });
    }

    // Now defer the reply
    await interaction.deferReply({ ephemeral: true });

    const effect = interaction.customId.split('_')[1];
    let resultMessage = '';
    
    switch (effect) {
        case 'gain':
            player.lives++;
            resultMessage = `💚 **GAIN LIFE!** You now have ${player.lives} lives.`;
            break;
        case 'lose':
            player.lives--;
            resultMessage = `💔 **LOSE LIFE!** You now have ${player.lives} lives.`;
            if (player.lives <= 0) {
                resultMessage += '\n💀 **YOU ARE ELIMINATED!**';
            }
            break;
        case 'safe':
            resultMessage = `🛡️ **SAFE!** You still have ${player.lives} lives.`;
            break;
    }

    // Mark player as having clicked this round
    gameState.roundClicks[userId] = true;

    await interaction.editReply({ 
        content: `🧬 **${interaction.user.username}**\n${resultMessage}`
    });

    // Check if all alive players have clicked, then proceed to next round
    await checkRoundProgress();
}

async function checkRoundProgress() {
    const alivePlayers = Object.entries(gameState.players)
        .filter(([_, player]) => player.lives > 0);
    
    const alivePlayerIds = alivePlayers.map(([userId, _]) => userId);
    
    console.log(`Alive players: ${alivePlayerIds.length}, All clicked: ${alivePlayerIds.every(playerId => gameState.roundClicks[playerId])}`);
    
    // Check if all alive players have clicked
    const allClicked = alivePlayerIds.every(playerId => gameState.roundClicks[playerId]);
    
    if (allClicked && alivePlayers.length > 1 && !gameState.nextRoundScheduled) {
        gameState.nextRoundScheduled = true;
        console.log('All players clicked, advancing to next round...');
        
        // All players clicked, start next round after delay
        setTimeout(async () => {
            if (gameState.isActive && alivePlayers.length > 1) {
                gameState.roundClicks = {}; // Reset click tracking
                gameState.nextRoundScheduled = false;
                
                // Send new round to the channel
                const channel = client.channels.cache.get(gameState.channelId);
                if (channel) {
                    await startNewRound(channel);
                }
                
                // Check if game should end after round progression
                await checkGameEnd();
            }
        }, 2000); // 2 second delay before next round
    }
    
    // Also check for game end condition
    if (alivePlayers.length <= 1) {
        await checkGameEnd();
    }
}

async function handleSoulTrade(interaction) {
    await interaction.deferReply({ ephemeral: false });
    
    const userId = interaction.user.id;
    const player = gameState.players[userId];
    
    if (!gameState.isActive) {
        return interaction.editReply({ 
            content: '❌ No active game!' 
        });
    }
    
    if (!player || player.lives <= 0) {
        return interaction.editReply({ 
            content: '❌ You cannot participate in soul trade!' 
        });
    }

    // Find player with highest lives
    const highest = Object.entries(gameState.players)
        .filter(([_, p]) => p.lives > 0)
        .reduce((a, b) => (b[1].lives > a[1].lives ? b : a));
    
    if (highest[0] === userId) {
        return interaction.editReply({ 
            content: '❌ You already have the most lives!' 
        });
    }

    // Perform the trade
    const userLives = gameState.players[userId].lives;
    const targetLives = highest[1].lives;
    
    gameState.players[userId].lives = targetLives;
    gameState.players[highest[0]].lives = userLives;

    await interaction.editReply({ 
        content: `🔁 **SOUL TRADE COMPLETE!**\n` +
                `<@${userId}> (${userLives} → ${targetLives} lives) ↔️ <@${highest[0]}> (${targetLives} → ${userLives} lives)` 
    });
}

async function handleRejoin(interaction) {
    await interaction.deferReply({ ephemeral: false });
    
    const userId = interaction.user.id;
    
    if (!gameState.isActive) {
        return interaction.editReply({ 
            content: '❌ No active game!' 
        });
    }
    
    // Check if player is eliminated (has 0 lives or not in game)
    if (!gameState.players[userId] || gameState.players[userId].lives <= 0) {
        gameState.players[userId] = { 
            lives: 5, 
            username: interaction.user.username 
        };
        await interaction.editReply({ 
            content: `🎉 **${interaction.user.username}** rejoined the game with 5 lives!` 
        });
    } else {
        await interaction.editReply({ 
            content: '❌ You are still alive in the game!' 
        });
    }
}

async function forceNextRound() {
    if (!gameState.isActive) return;
    console.log('Forcing next round due to timeout...');
    
    const alivePlayers = Object.entries(gameState.players)
        .filter(([_, player]) => player.lives > 0);
    
    if (alivePlayers.length <= 1) {
        await checkGameEnd();
        return;
    }
    
    // Prevent multiple round advances
    if (gameState.nextRoundScheduled) {
        return;
    }
    gameState.nextRoundScheduled = true;
    
    // Reset click tracking for next round
    gameState.roundClicks = {};
    
    const channel = client.channels.cache.get(gameState.channelId);
    if (channel) {
        // Send message about round timeout
        await channel.send({ 
            content: `⏰ **Time's up!** Moving to next round...` 
        });
        
        // Start new round
        setTimeout(async () => {
            if (gameState.isActive && alivePlayers.length > 1) {
                gameState.nextRoundScheduled = false;
                await startNewRound(channel);
            }
        }, 1000);
    }
}

async function checkGameEnd() {
    const alivePlayers = Object.entries(gameState.players)
        .filter(([_, player]) => player.lives > 0);
    
    const channel = client.channels.cache.get(gameState.channelId);
    
    if (alivePlayers.length === 1) {
        const winner = alivePlayers[0];
        
        if (channel) {
            await channel.send({ 
                content: `🏆 **GAME OVER!**\n\n` +
                        `👑 **<@${winner[0]}>** is the last one standing!\n` +
                        `🎮 **Trouble Syndicate CLICK GAME** has ended!\n\n` +
                        `Final lives: ${winner[1].lives}` 
            });
        }
        
        // Reset game state
        gameState = {
            isActive: false,
            players: {},
            round: 0,
            host: null,
            channelId: null,
            roundClicks: {},
            nextRoundScheduled: false
        };
    } else if (alivePlayers.length === 0) {
        if (channel) {
            await channel.send({ 
                content: `💀 **EVERYONE IS ELIMINATED!**\n\n` +
                        `🎮 **Trouble Syndicate CLICK GAME** has ended in a draw!\n` +
                        `Better luck next time!` 
            });
        }
        
        // Reset game state
        gameState = {
            isActive: false,
            players: {},
            round: 0,
            host: null,
            channelId: null,
            roundClicks: {},
            nextRoundScheduled: false
        };
    }
}

client.on('error', console.error);

// Login to Discord
if (!process.env.DISCORD_TOKEN) {
    console.error('DISCORD_TOKEN not found in environment variables!');
    console.log('Please set your Discord bot token in the environment variables.');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);