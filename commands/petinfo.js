const {
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const PET_FILE = path.join(__dirname, '../pet.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('petinfo')
        .setDescription('Lihat informasi tentang pet dari Grow a Garden Wiki')
        .addStringOption(option =>
            option.setName('name')
            .setDescription('Nama pet (contoh: Hamster, Butterfly)')
            .setRequired(true)
            .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();
        let petList = [];

        try {
            if (fs.existsSync(PET_FILE)) {
                const raw = fs.readFileSync(PET_FILE, 'utf8');
                const data = JSON.parse(raw);
                petList = Object.keys(data);
            }
        } catch (err) {
            console.error("❌ Error membaca pet.json:", err);
            return interaction.respond([]);
        }

        const results = petList
            .filter(name => name.toLowerCase().includes(focused.toLowerCase()))
            .slice(0, 25)
            .map(name => ({
                name,
                value: name
            }));

        await interaction.respond(results);
    },

    async execute(interaction) {
        const petName = interaction.options.getString('name');

        let petData;
        try {
            const raw = fs.readFileSync(PET_FILE, 'utf8');
            const data = JSON.parse(raw);
            petData = data[petName];
        } catch (err) {
            return interaction.reply({
                content: '❌ Terjadi kesalahan membaca data pet.',
                ephemeral: true
            });
        }

        if (!petData) {
            return interaction.reply({
                content: `❌ Pet dengan nama "${petName}" tidak ditemukan.`,
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(`🐾 ${petName}`)
            .setColor(0x87CEEB)
            .addFields(petData.fields)
            .setFooter({
                text: 'Bot by borzxy'
            });

        if (petData.image) embed.setThumbnail(petData.image);

        await interaction.reply({
            embeds: [embed]
        });
    }
};