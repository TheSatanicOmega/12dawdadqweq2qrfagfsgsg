const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const PET_FILE = path.join(__dirname, '../pet.json');

async function fetchPetList() {
    const url = "https://growagarden.fandom.com/api.php?action=query&list=categorymembers&cmtitle=Category:Pets&cmlimit=100&format=json&origin=*";
    const res = await fetch(url);
    const json = await res.json();
    return json?.query?.categorymembers?.map(p => p.title) || [];
}

async function fetchPetDetails(petName) {
    const url = `https://growagarden.fandom.com/api.php?action=query&prop=pageprops&titles=${encodeURIComponent(petName)}&format=json&origin=*`;
    const res = await fetch(url);
    const json = await res.json();
    const page = Object.values(json.query.pages)[0];

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
                    const value = rawValue.replace(/<[^>]*>?/gm, '').trim();
                    info[label] = value;
                }
            }
        }
    }
    const fields = [{
            name: "🏆 Tier",
            value: info["Tier"] || "Tidak ada",
            inline: true
        },
        {
            name: "🛒 Diperoleh dari",
            value: info["Obtaining method"] || "Tidak diketahui",
            inline: true
        },
        {
            name: "💰 Passive",
            value: info["Passive"] || "Tidak ada",
            inline: false
        },
        {
            name: "🍖 Hunger",
            value: info["Hunger"] || "Tidak ada",
            inline: true
        },
        {
            name: "📅 Rilis",
            value: info["Date Added"] || "Tidak ada",
            inline: true
        }
    ];

    return {
        image,
        fields
    };
}

async function updatePetJSON() {
    const petNames = await fetchPetList();
    const petData = {};

    for (const name of petNames) {
        try {
            const detail = await fetchPetDetails(name);
            if (detail) {
                petData[name] = detail;
            } else {
                console.warn(`⚠️ Data kosong: ${name}`);
            }
        } catch (err) {
            console.error(`❌ Gagal fetch ${name}:`, err.message);
        }
        await new Promise(res => setTimeout(res, 500));
    }

    fs.writeFileSync(PET_FILE, JSON.stringify(petData, null, 2), 'utf8');
    console.log("✅ File pet.json berhasil diperbarui!");
}

function startPetUpdater() {
    updatePetJSON();
    setInterval(updatePetJSON, 10 * 60 * 1000);
}

module.exports = {
    startPetUpdater
};