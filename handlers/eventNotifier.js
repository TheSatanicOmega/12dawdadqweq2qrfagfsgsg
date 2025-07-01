const moment = require('moment-timezone');
const {
    EmbedBuilder,
    ChannelType
} = require('discord.js');

const CHANNEL_ID = '1388855726486716527';
const IMAGE_URL = 'https://static.wikia.nocookie.net/growagarden/images/a/ad/SummerHarvestIslandNew.png/revision/latest?cb=20250628142023';
const EVENT_NAME = 'Summer Harvest';
const ROLE_PING = '<@&123456789012345678>';

let currentMessage = null;
let lastHour = null;

module.exports = (client) => {
    setInterval(async () => {
        const now = moment().tz('Asia/Jakarta');
        const minutes = now.minutes();
        const seconds = now.seconds();
        const hour = now.hour();

        const channel = await client.channels.fetch(CHANNEL_ID);
        if (!channel || channel.type !== ChannelType.GuildText) return;
        if (minutes === 58 && seconds === 0 && lastHour !== hour) {
            lastHour = hour;

            const unixStart = Math.floor(now.clone().add(2, 'minutes').valueOf() / 1000);
            const embed = new EmbedBuilder()
                .setTitle(`🌞 [Event Incoming!] ${EVENT_NAME}`)
                .setDescription(`The **${EVENT_NAME}** event will begin <t:${unixStart}:R>!\nGather your tools and prepare to sell your fruit at boosted prices!`)
                .addFields({
                    name: '⏰ Time',
                    value: 'Every hour (WITA)',
                    inline: true
                }, {
                    name: '📍 Location',
                    value: 'All Garden Islands',
                    inline: true
                })
                .setImage(IMAGE_URL)
                .setColor('Yellow')
                .setTimestamp();

            currentMessage = await channel.send({
                content: `☀️ ${EVENT_NAME} is about to begin!`,
                embeds: [embed]
            }); // ${ROLE_PING}
        }
        if (minutes === 0 && seconds === 0 && currentMessage) {
            const embed = new EmbedBuilder()
                .setTitle(`✅ [Event Started] ${EVENT_NAME}`)
                .setDescription(`The **${EVENT_NAME}** event has officially started!\nSumbit your summer fruits to the Harvest Wagon.`)
                .setImage(IMAGE_URL)
                .setColor('Green')
                .setTimestamp();

            await currentMessage.edit({
                content: `✅ ${EVENT_NAME} has started!`,
                embeds: [embed]
            });
        }
        if (minutes === 10 && seconds === 0 && currentMessage) {
            const embed = new EmbedBuilder()
                .setTitle(`❌ [Event Ended] ${EVENT_NAME}`)
                .setDescription(`The **${EVENT_NAME}** event has ended.\nHope you made some great profits 🌽🍍`)
                .setColor('Grey')
                .setTimestamp();

            await currentMessage.edit({
                content: null,
                embeds: [embed]
            });
        }
    }, 1000);
};
