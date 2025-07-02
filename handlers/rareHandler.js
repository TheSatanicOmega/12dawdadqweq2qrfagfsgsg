const {
    EmbedBuilder
} = require('discord.js');

module.exports = (client) => {
    const SOURCE_CHANNEL_ID = '1378284226121695302';
    const TARGET_CHANNEL_ID = '1389920277923889352';
    const WHITELIST_KEYWORDS = ['Oasis Egg', 'Paradise Egg', 'Bee Egg'];

    client.on('messageCreate', async (message) => {
        if (message.channel.id !== SOURCE_CHANNEL_ID) return;
        if (!message.embeds.length) return;
        const embed = message.embeds[0];
        const found = embed.fields?.some(field =>
            WHITELIST_KEYWORDS.some(keyword =>
                field.value?.toLowerCase().includes(keyword.toLowerCase())
            )
        );
        if (!found) return;
        const targetChannel = await client.channels.fetch(TARGET_CHANNEL_ID);
        if (!targetChannel?.isTextBased()) return;
        const forwardedEmbed = new EmbedBuilder()
            .setTitle(embed.title || null)
            .setDescription(embed.description || null)
            .setFields(embed.fields || [])
            .setColor(embed.color || 0xFEE75C)
            .setThumbnail(embed.thumbnail?.url || null)
            .setImage(embed.image?.url || null)
            .setFooter(embed.footer ? {
                text: embed.footer.text
            } : null)
            .setTimestamp(embed.timestamp ? new Date(embed.timestamp) : new Date());

        await targetChannel.send({
            content: "Whitelisted key has been found! <@1129472524166627428>",
            embeds: [forwardedEmbed]
        });
    });
};
