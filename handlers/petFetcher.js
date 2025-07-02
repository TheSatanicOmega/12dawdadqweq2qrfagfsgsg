function petScrapper () {
    const fs = require('fs');
    const pets = JSON.parse(fs.readFileSync('./pet.json', 'utf-8'));

    const eggMap = {};

    for (const [petName, petData] of Object.entries(pets)) {
        if (!Array.isArray(petData.fields)) continue;

        for (const field of petData.fields) {
            if (field.name === "🛒 Diperoleh dari") {
                const egg = field.value.trim();
                if (!eggMap[egg]) eggMap[egg] = [];
                eggMap[egg].push(petName);
            }
        }
    }

    fs.writeFileSync('../eggDropList.json', JSON.stringify(eggMap, null, 2));
}

function startPetScrapper () {
    petScrapper();
    setInterval(petScrapper, 10 * 60 * 1000);
}

module.exports = {
    startPetScrapper
};
