const {
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} = require('discord.js');
const crops = require('../crops.json');
const mutations = require('../mutations.json');

function formatPrice(price) {
    if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)}B¢`;
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M¢`;
    if (price >= 1_000) return `${(price / 1_000).toFixed(1)}K¢`;
    return `${price}¢`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('price-calculator')
        .setDescription('Hitung harga buah berdasarkan berat dan mutasi.')
        .addStringOption(opt =>
            opt.setName('fruit')
            .setDescription('Nama buah')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addNumberOption(opt =>
            opt.setName('weight')
            .setDescription('Berat buah (kg)')
            .setRequired(true)
        ),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        const options = Object.keys(crops)
            .filter(crop => crop.toLowerCase().includes(focused))
            .slice(0, 25)
            .map(name => ({
                name,
                value: name
            }));
        await interaction.respond(options);
    },

    async execute(interaction) {
        const fruit = interaction.options.getString('fruit');
        const weight = interaction.options.getNumber('weight');
        const crop = crops[fruit];

        if (!crop) return interaction.reply({
            content: '❌ Buah tidak ditemukan di database.',
            ephemeral: true
        });

        const basePrice = parseInt(crop.value.replace(/[, ]/g, '')) || 0;
        const fruitImg = crop.image;

        const baseGrowthRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
            .setCustomId('base_growth')
            .setPlaceholder('Pilih Growth Mutation (Gold/Rainbow)...')
            .addOptions([{
                    label: 'None',
                    value: 'None'
                },
                {
                    label: 'Rainbow (x50)',
                    value: 'Rainbow'
                },
                {
                    label: 'Gold (x20)',
                    value: 'Gold'
                }
            ])
        );

        const environmentalRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
            .setCustomId('environmental')
            .setPlaceholder('Pilih Environmental Mutations...')
            .setMinValues(0)
            .setMaxValues(3)
            .addOptions([{
                    label: 'Wet (x1)',
                    value: '1.2'
                },
                {
                    label: 'Chilled (x1)',
                    value: '0.8'
                },
                {
                    label: 'Frozen (x9)',
                    value: '1.5'
                }
            ])
        );

        const additiveRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
            .setCustomId('additive')
            .setPlaceholder('Pilih Additive Mutations...')
            .setMinValues(0)
            .setMaxValues(5)
            .addOptions(Object.entries(mutations).map(([key, m]) => ({
                label: key + " (x" + m.multiplier + ")",
                description: m.description || '',
                value: `${key}:${m.multiplier}`
            })))
        );

        const buttonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setCustomId('calculate_price')
            .setLabel('Calculate')
            .setStyle(ButtonStyle.Success)
        );

        /*const embed = new EmbedBuilder()
            .setTitle(`Calculator for ${fruit}`)
            .setDescription(`Weight: **${weight}kg**\nBase Price: \`${basePrice.toLocaleString()} coins\``)
            .setThumbnail(fruitImg)
            .setColor('Green');

        await interaction.deferReply();
        const msg = await interaction.editReply({
            embeds: [embed],
            components: [baseGrowthRow, environmentalRow, additiveRow, buttonRow]
        });*/
        await interaction.deferReply();
        const msg = await interaction.editReply({
            content: `Calculator for <@${interaction.user.id}>:\nSelect the modifiers for your **${fruit}** (Weight: ${weight}kg):`,
            components: [baseGrowthRow, environmentalRow, additiveRow, buttonRow]
        });

        const collector = msg.createMessageComponentCollector({
            time: 30000,
            idle: 30000
        });

        let selected = {
            baseGrowth: 'None',
            environmental: [],
            additive: [],
            additiveRaw: []
        };

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id)
                return i.reply({
                    content: '❌ Bukan interaksimu!',
                    ephemeral: true
                });

            if (i.customId === 'base_growth') {
                selected.baseGrowth = i.values[0];
                await i.deferUpdate();
            }

            if (i.customId === 'environmental') {
                selected.environmental = i.values.map(parseFloat);
                await i.deferUpdate();
            }

            if (i.customId === 'additive') {
                selected.additive = i.values.map(val => {
                    const [, mult] = val.split(':');
                    return parseFloat(mult);
                });
                selected.additiveRaw = i.values.map(val => val.split(':')[0]);
                await i.deferUpdate();
            }

            if (i.customId === 'calculate_price') {
                const growthMult = {
                    None: 1,
                    Gold: 20,
                    Rainbow: 50
                } [selected.baseGrowth || 'None'];

                const combinedMutations = [...selected.environmental, ...selected.additive];
                const mutationSum = combinedMutations.reduce((a, b) => a + b, 0);
                const mutationAvg = combinedMutations.length > 0 ?
                    mutationSum / combinedMutations.length :
                    1;

                const totalPrice = Math.floor(weight * basePrice * growthMult * mutationAvg);

                const mutationNames = [
                    ...(selected.baseGrowth !== 'None' ? [selected.baseGrowth] : []),
                    ...selected.environmental.map(env => {
                        if (env === 1.2) return 'Wet';
                        if (env === 0.8) return 'Chilled';
                        if (env === 1.5) return 'Frozen';
                        return `x${env}`;
                    }),
                    ...selected.additiveRaw
                ];

                const resultEmbed = new EmbedBuilder()
                    .setTitle('📥 Fetched → Item Price')
                    .setDescription(`🌸 [${mutationNames.join(', ') || 'None'}] ${fruit} (${weight} KG)`)
                    .addFields({
                        name: '📘 Info',
                        value: `◈ ${fruit}\n` +
                            `◈ Mutations: ${mutationNames.join(', ') || 'None'}\n` +
                            `◈ Weight: ${weight} KG`
                    }, {
                        name: '💰 Estimated Price',
                        value: `◈ ${formatPrice(totalPrice)}`
                    })
                    .setThumbnail(fruitImg)
                    .setColor('Gold');

                await i.update({
                    content: null,
                    embeds: [resultEmbed]
                });
            }
        });

        collector.on('end', async () => {
            const disabledRows = msg.components.map(row => {
                const newRow = new ActionRowBuilder();
                for (const component of row.components) {
                    if (component.type === 3) {
                        newRow.addComponents(
                            StringSelectMenuBuilder.from(component).setDisabled(true)
                        );
                    } else if (component.type === 2) {
                        newRow.addComponents(
                            ButtonBuilder.from(component).setDisabled(true)
                        );
                    }
                }
                return newRow;
            });

            await msg.edit({
                components: disabledRows
            });
        });
    }
};