const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../crops.json');
const CATEGORY = 'Category:Crops';

async function fetchCropList() {
    const url = `https://growagarden.fandom.com/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(CATEGORY)}&cmlimit=100&format=json&origin=*`;
    const res = await fetch(url);
    const json = await res.json();
    return json.query.categorymembers.map(p => p.title);
}

async function fetchCropDetails(name) {
    const url = `https://growagarden.fandom.com/api.php?action=query&prop=pageprops&ppprop=infoboxes&titles=${encodeURIComponent(name)}&format=json&origin=*`;
    const res = await fetch(url);
    const json = await res.json();
    const page = Object.values(json.query.pages)[0];
    if (!page.pageprops?.infoboxes) return null;

    const infobox = JSON.parse(page.pageprops.infoboxes);
    const data = infobox[0].data;

    let image = null;
    const info = {};
    for (const item of data) {
        if (item.type === 'image' && item.data[0]?.url) {
            image = item.data[0].url;
            break;
        }
    }
    if (!image) {
        for (const item of data) {
            if (item.type === 'group') {
                for (const sub of item.data.value) {
                    if (sub.type === 'image' && sub.data[0]?.url) {
                        image = sub.data[0].url;
                        break;
                    }
                }
            }
            if (image) break;
        }
    }
    if (!image) {
        for (const item of data) {
            if (item.type === 'group') {
                for (const sub of item.data.value) {
                    if (sub.type === 'data' && typeof sub.data.value === 'string') {
                        const match = sub.data.value.match(/<img[^>]+src="([^"]+)"/);
                        if (match) {
                            image = match[1];
                            break;
                        }
                    }
                }
            }
            if (image) break;
        }
    }
    for (const item of data) {
        if (item.type === 'group') {
            item.data.value.forEach(sub => {
                if (sub.type === 'data') {
                    const label = sub.data.label?.toLowerCase() || '';
                    const raw = sub.data.value;
                    const cleaned = raw.replace(/<[^>]+>/g, '').trim();
                    if (label.includes('value') || label.includes('sell') || label.includes('worth')) {
                        info['Value'] = cleaned;
                    } else if (label.includes('tier')) {
                        info['Tier'] = cleaned;
                    } else if (label.includes('seed price')) {
                        info['Seed Price'] = cleaned;
                    } else if (label.includes('stock')) {
                        info['Stock'] = cleaned;
                    } else if (label.includes('multi')) {
                        info['Multi‑Harvest'] = cleaned;
                    } else if (label.includes('obtainable')) {
                        info['Obtainable?'] = cleaned;
                    }
                    if (!info['Value'] && /coin/i.test(raw) && /\d+/.test(raw)) {
                        info['Value'] = cleaned;
                    }
                }
            });
        }
    }

    return {
        image,
        value: info['Value'] || '',
        tier: info['Tier'] || '',
        seed_price: info['Seed Price'] || '',
        stock: info['Stock'] || '',
        multi_harvest: info['Multi‑Harvest'] || '',
        obtainable: info['Obtainable?'] || ''
    };
}


async function updateCropJSON() {
    console.log('🔄 Fetching crop list...');
    const names = await fetchCropList();
    const result = {};

    for (const name of names) {
        try {
            const crop = await fetchCropDetails(name);
            if (crop) {
                result[name] = crop;
            }
        } catch (err) {
            console.error(`❌ Failed ${name}:`, err.message);
        }
        await new Promise(res => setTimeout(res, 300));
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log(`🎉 Saved ${Object.keys(result).length} crops to crops.json`);
}

function startCropUpdater() {
    updateCropJSON();
    setInterval(updateCropJSON, 10 * 60 * 1000);
}

module.exports = {
    startCropUpdater
};