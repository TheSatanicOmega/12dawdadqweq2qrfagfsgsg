const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const EGG_FILE = path.join(__dirname, '../eggs.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Lihat informasi tentang egg dari Grow a Garden Wiki')
        .addStringOption(option =>
            option.setName('name')
            .setDescription('Nama egg (contoh: Bug Egg, Paradise Egg)')
            .setRequired(true)
            .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();
        let eggList = [];

        try {
            if (fs.existsSync(EGG_FILE)) {
                const raw = fs.readFileSync(EGG_FILE, 'utf8');
                const data = JSON.parse(raw);
                eggList = Object.keys(data);
            }
        } catch (err) {
            console.error("❌ Error membaca eggs.json:", err);
            return interaction.respond([]);
        }

        const results = eggList
            .filter(name => name.toLowerCase().includes(focused.toLowerCase()))
            .slice(0, 25)
            .map(name => ({
                name,
                value: name
            }));

        await interaction.respond(results);
    },

    async execute(interaction) {
        const eggName = interaction.options.getString('name');

        let eggData;
        try {
            const raw = fs.readFileSync(EGG_FILE, 'utf8');
            const data = JSON.parse(raw);
            eggData = data[eggName];
        } catch (err) {
            return interaction.reply({
                content: '❌ Terjadi kesalahan membaca data egg.',
                ephemeral: true
            });
        }

        if (!eggData) {
            return interaction.reply({
                content: `❌ Egg dengan nama "${eggName}" tidak ditemukan.`,
                ephemeral: true
            });
        }

        // 🟨 Format harga
        let priceText = '';
        if (eggData.priceParsed) {
            const robuxOpts = eggData.priceParsed.robuxOptions?.map(opt => `${opt.eggs} Egg${opt.eggs > 1 ? 's' : ''}: ${opt.robux} Robux`);
            const sheckle = eggData.priceParsed.sheckle ? `${eggData.priceParsed.sheckle.toLocaleString()} Shekles` : null;
            const parts = [...(robuxOpts || []), ...(sheckle ? [sheckle] : [])];
            priceText = parts.length ? parts.join('\n') : 'Unknown';
        } else {
            priceText = 'Unknown';
        }

        // 🟨 Format pets
        let petsText = 'No known pets.';
        if (eggData.pets && Object.keys(eggData.pets).length > 0) {
            petsText = Object.entries(eggData.pets)
                .map(([name, chance]) => `• ${name}: ${chance}%`)
                .join('\n');
        }

        const embed = new EmbedBuilder()
            .setTitle(`${eggName}`)
            .setDescription("```" + eggData.description + "```" || 'No description available.')
            .setColor(0x00B7FF)
            .addFields({
                name: '💰 Price',
                value: "```" + priceText + "```",
                inline: true
            }, {
                name: '⏱️ Hatch Time',
                value: "**" + eggData.hatchTime + "**" || 'Unknown',
                inline: true
            }, {
                name: '📅 Release Date',
                value: "**" + eggData.releaseDate + "**" || 'Unknown',
                inline: true
            }, {
                name: '✅ Obtainable?',
                value: eggData.obtainable ? '**Yes**' : '**No**',
                inline: true
            }, {
                name: '🐾 Pets',
                value: "```" + petsText + "```",
                inline: false
            })
            .setFooter({
                text: 'Bot created by borzxy'
            });

        if (eggData.image) embed.setThumbnail(eggData.image);

        await interaction.reply({
            embeds: [embed]
        });
    }
};
