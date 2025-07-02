const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const EGG_FILE = path.join(__dirname, '../egg.json');

async function fetchEggList() {
    const url = "https://growagarden.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Eggs&cmlimit=100&format=json&origin=*";
    const res = await fetch(url);
    const json = await res.json();
    return json?.query?.categorymembers?.map(p => p.title) || [];
}

function stripHtml(html) {
    return html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

async function fetchEggDetails(eggName) {
    const url = `https://growagarden.fandom.com/api.php?action=query&prop=pageprops&titles=${encodeURIComponent(eggName)}&format=json&origin=*`;
    const res = await fetch(url);
    const json = await res.json();
    const page = Object.values(json.query.pages)[0];

    const description = page.pageprops?.fandomdescription ?
        stripHtml(page.pageprops.fandomdescription) :
        null;

    if (!page.pageprops?.infoboxes) return null;

    const infobox = JSON.parse(page.pageprops.infoboxes);
    const dataItems = infobox[0].data;

    let image = null;
    let info = {};

    for (const item of dataItems) {
        if (item.type === "image" && item.data[0]?.url) {
            image = item.data[0].url;
        }

        if (item.type === "group") {
            for (const sub of item.data.value) {
                if (sub.type === "data") {
                    const label = sub.data.label;
                    const rawValue = sub.data.value;
                    const value = stripHtml(rawValue || "");
                    info[label] = value;
                }
            }
        }
    }

    const fields = [{
            name: "💰 Egg Price",
            value: info["Egg Price"] || "Tidak diketahui",
            inline: true
        },
        {
            name: "⏱️ Hatch Time",
            value: info["Hatch Time"] || "Tidak diketahui",
            inline: true
        },
        {
            name: "✅ Obtainable?",
            value: info["Obtainable?"] || "Tidak ada",
            inline: false
        },
        {
            name: "📅 Date Added",
            value: info["Date Added"] || "Tidak ada",
            inline: true
        }
    ];

    return {
        description,
        image,
        fields
    };
}

async function updateEggJSON() {
    const eggNames = await fetchEggList();
    const eggData = {};

    for (const name of eggNames) {
        try {
            const detail = await fetchEggDetails(name);
            if (detail) {
                eggData[name] = detail;
            } else {
                //console.warn(`⚠️  No data found: ${name}`);
            }
        } catch (err) {
           console.error(`❌ Failed to fetch ${name}:`, err.message);
        }

        await new Promise(r => setTimeout(r, 500));
    }

    fs.writeFileSync(EGG_FILE, JSON.stringify(eggData, null, 2), 'utf8');
    //console.log("✅ egg.json updated!");
}

function startEggUpdater() {
    updateEggJSON();
    setInterval(updateEggJSON, 60 * 1000);
}

module.exports = {
    startEggUpdater
};
