const moment = require('moment-timezone');
const {
    EmbedBuilder,
    ChannelType
} = require('discord.js');

const CHANNEL_ID = '1388855726486716527';
const IMAGE_URL = 'https://static.wikia.nocookie.net/growagarden/images/a/ad/SummerHarvestIslandNew.png/revision/latest?cb=20250628142023';
const EVENT_NAME = 'Summer Harvest';
const ROLE_PING = '<@&123456789012345678>';

module.exports = (client) => {
    setInterval(async () => {
        const now = moment().tz('Asia/Jakarta');
        const minutes = now.minutes();
        const seconds = now.seconds();

        const channel = await client.channels.fetch(CHANNEL_ID);
        if (!channel || channel.type !== ChannelType.GuildText) return;

        if (minutes === 58 && seconds === 0) {
            const unixStart = Math.floor(now.clone().add(2, 'minutes').valueOf() / 1000);

            const embed = new EmbedBuilder()
                .setTitle(`🌞 [Event Incoming!] ${EVENT_NAME}`)
                .setDescription(`The **${EVENT_NAME}** event will begin <t:${unixStart}:R>!\nGather your tools and prepare to sell your fruit at boosted prices!`)
                .addFields({
                    name: '⏰ Time',
                    value: 'Every hour (WIB)',
                    inline: true
                }, {
                    name: '📍 Location',
                    value: 'All Garden Islands',
                    inline: true
                })
                .setImage(IMAGE_URL)
                .setColor('Yellow')
                .setTimestamp();

            channel.send({
                content: `☀️ ${EVENT_NAME} is about to begin!`,
                embeds: [embed]
            }); //${ROLE_PING}
            console.log("Event is about to begin...")
        }
        if (minutes === 10 && seconds === 0) {
            const embed = new EmbedBuilder()
                .setTitle(`🌙 [Event Ended] ${EVENT_NAME}`)
                .setDescription(`The **${EVENT_NAME}** event has just ended!\nHope you made some great profits 🌽🍍`)
                .setColor('Grey')
                .setTimestamp();

            channel.send({
                embeds: [embed]
            });
            console.log("Event ended...")
        }

    }, 1000);
};
