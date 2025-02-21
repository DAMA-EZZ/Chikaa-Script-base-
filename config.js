/**
* Script by Damaa
* wa.me/6285732245264
* Jangan perjual belikan Script ini tanpa seizin Developer !!
**/

const fs = require("fs");
const chalk = require("chalk");
const pkg = require('./package.json')

global.owner = ['6285732245264', '66835010791'];
global.mods = ['6285732245264'];
global.prems = ['6285732245264'];
global.nameowner = 'Dama';
global.numberowner = '6285732245264';
global.sowner = '6285732245264@s.whatsapp.net'
global.namebot = "Chikaà";
global.botname = "i c h i k a ? yes i am here";
global.mail = 'null@gmail.com';
/**===================|LINK|===================**/
global.sgc = "https://chat.whatsapp.com/CoDXkdX7Dcq9TaimSmR16y";
global.sig = 'https://instagram.com/cheerii44u';
global.sch = 'https://whatsapp.com/channel/0029VaEs4oDGufJ5IukGkA0z';
global.thumb = 'https://pomf2.lain.la/f/4z2jol0.jpg'; //'https://pomf2.lain.la/f/f4mspdg.jpg'; //"https://telegra.ph/file/a89b732fdf3d06c79b6b9.jpg";
/**===================|Status|===================**/
global.wm = `${pkg.name} - Assistant@${pkg.version}`;
global.wait = 'Please Wait . . .';
global.done = '```Success! task completed.```';
global.eror = 'System error, please try again later.';
/**===================|Stickers|===================**/
global.packname = 'Sticker';
global.author = global.botname;
/**===================||===================**/
global.version = pkg.version;
global.idgc = '120363156878033452@g.us';
global.idch = '120363185135537355@newsletter';
global.multiplier = 45;
global.limit = 60;
global.max_upload = "100MB"
global.addReply = false;
global.dama = 'ichika';
global.session = 'session';
global.database = 'chika-db';
global.pairing = '6282142688189';
/**===================|Payment|===================**/
global.payment = {
    dana: '085732245264',
    pulsa: '085732245264',
    qris: '-',
}
/**===================|Key|===================**/
global.btc = "";
global.skizo = "Sasaki";
global.syaiKey = "QzHYtH6bpLZy";
global.NeoxrKey = "damaaaaaaa";
global.lann = "uC7nZM5D"; //GetsuZo
global.PRODIAKEY = "";
/**===================|APIs-Key|===================**/
global.APIs = {
    lol: 'https://api.lolhuman.xyz',
    rose: 'https://api.itsrose.rest',
    xzn: 'https://skizo.tech',
    neoxr: 'https://api.neoxr.eu/api',
    btchx: 'https://api.botcahx.eu.org',
    lann: 'https://api.betabotz.org',
}
/**===================|Rest-APIs|===================**/
global.APIKeys = {
    'https://api.lolhuman.xyz': 'RyAPI',
    'https://api.itsrose.rest': 'Rk-f5d4b183e7dd3dd0a44653678ba5107c',
    'https://skizo.tech': 'RyHar',
    'https://api.neoxr.eu': global.NeoxrKey,
    'https://api.botcahx.eu.org': 'ngGdhzHk',
    'https://api.betabotz.org': 'Jawaa',
}
/**===================|RPG|===================**/
global.rpg = {
    emoticon(string) {
        string = string.toLowerCase();
        let emot = {
            agility: '🤸‍♂️',
            arc: '🏹',
            armor: '🥼',
            bank: '🏦',
            bibitanggur: '🍇',
            bibitapel: '🍎',
            bibitjeruk: '🍊',
            bibitmangga: '🥭',
            bibitpisang: '🍌',
            bow: '🏹',
            bull: '🐃',
            cat: '🐈',
            chicken: '🐓',
            common: '📦',
            cow: '🐄',
            crystal: '🔮',
            darkcrystal: '♠️',
            diamond: '💎',
            dog: '🐕',
            dragon: '🐉',
            elephant: '🐘',
            emerald: '💚',
            exp: '✉️',
            fishingrod: '🎣',
            fox: '🦊',
            gems: '🍀',
            giraffe: '🦒',
            gold: '👑',
            health: '❤️',
            horse: '🐎',
            intelligence: '🧠',
            iron: '⛓️',
            keygold: '🔑',
            keyiron: '🗝️',
            knife: '🔪',
            legendary: '🗃️',
            level: '🧬',
            limit: '⚡',
            lion: '🦁',
            magicwand: '⚕️',
            mana: '🪄',
            money: '💵',
            mythic: '🗳️',
            pet: '🎁',
            petFood: '🍖',
            pickaxe: '⛏️',
            pointxp: '📧',
            potion: '🥤',
            rock: '🪨',
            snake: '🐍',
            stamina: '💪',
            strength: '🦹‍♀️',
            string: '🕸️',
            superior: '💼',
            sword: '⚔️',
            tiger: '🐅',
            trash: '🗑',
            uncommon: '🎁',
            upgrader: '🧰',
            wood: '🪵'
        }
        let results = Object.keys(emot).map(v => [v, new RegExp(v, 'gi')]).filter(v => v[1].test(string));
        if (!results.length) return '';
        else return emot[results[0][0]];
    }
}
let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright("Update 'config.js'"))
    delete require.cache[file]
    require(file)
})