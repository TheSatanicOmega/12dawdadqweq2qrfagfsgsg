const {
    Client,
    Collection,
    GatewayIntentBits
} = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const {
    REST,
    Routes
} = require('discord.js');

const {
    startPetUpdater
} = require('./handlers/petFetcher');

const {
    startEggUpdater
} = require('./handlers/eggFetcher');

const {
    startCropUpdater
} = require('./handlers/cropsFetcher')

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});
client.commands = new Collection();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
        console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
        console.warn(`⚠️ Invalid command file: ${file}`);
    }
}

const rest = new REST({
    version: '10'
}).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`🔁 Refreshing ${commands.length} guild (/) commands...`);
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
            body: commands,
        });
        console.log('✅ Guild slash commands registered!');
    } catch (error) {
        console.error('❌ Failed to register commands:', error);
    }
})();

client.once('ready', () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
    startPetUpdater();
    startEggUpdater();
    require('./handlers/eventNotifier.js')(client);
    //startCropUpdater();
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            await command.execute(interaction);
        } else if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            if (command?.autocomplete) {
                await command.autocomplete(interaction);
            }
        }
    } catch (err) {
        console.error('❌ Interaction error:', err);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: '❌ Terjadi kesalahan saat menjalankan perintah.',
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: '❌ Terjadi kesalahan.',
                ephemeral: true
            });
        }
    }
});

client.login(process.env.TOKEN);