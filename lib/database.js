module.exports = (m) => {
    const isNumber = (x) => typeof x === "number" && !isNaN(x);
    const delay = (ms) =>
        isNumber(ms) && new Promise((resolve) => setTimeout(resolve, ms));
    let user = global.db.data.users[m.sender]
    if (typeof user !== 'object') global.db.data.users[m.sender] = {}
    if (user) {
        if (!isNumber(user.level)) user.level = 0
        if (!('pasangan' in user)) user.pasangan = ''
        if (!isNumber(user.exp)) user.exp = 0
        if (!isNumber(user.limit)) user.limit = 100
        if (!isNumber(user.lastclaim)) user.lastclaim = 0
        if (!isNumber(user.money)) user.money = 1000
        if (!isNumber(user.bank)) user.bank = 0
        if (!'banned' in user) user.banned = false
        if (!isNumber(user.warn)) user.warn = 0
        if (!isNumber(user.afk)) user.afk = -1
        if (!'afkReason' in user) user.afkReason = ''
        if (!'afkObj' in user) user.afkObj = {}
        if (!isNumber(user.lasteen)) user.lasteen = 0
        if (!('registered' in user)) user.registered = false
        if (!user.registered) {
            if (!('name' in user)) user.name = conn.getName(m.sender)
            if (!isNumber(user.age)) user.age = -1
            if (!isNumber(user.premiumDate)) user.premiumDate = -1
            if (!isNumber(user.regTime)) user.regTime = -1
        }
        if (!user.premium) user.premium = false
        if (!user.role) user.role = 'Newbie ㋡'
        if (!user.votekick) user.votekick = []
        if (!('autolevelup' in user)) user.autolevelup = true
    } else global.db.data.users[m.sender] = {
        level: 0,
        pasangan: '',
        exp: 0,
        limit: 100,
        lastclaim: 0,
        money: 1000,
        bank: 0,
        banned: false,
        warn: 0,
        afk: -1,
        afkReason: '',
        afkObj: {},
        lastseen: 0,
        registered: false,
        name: conn.getName(m.sender),
        age: -1,
        premiumDate: 0,
        regTime: -1,
        premium: false,
        role: 'Newbie ㋡',
        votekick: [],
        autolevelup: true,
    }
    let chat = global.db.data.chats[m.chat]
    if (typeof chat !== 'object') global.db.data.chats[m.chat] = {}
    if (chat) {
        if (!('mute' in chat)) chat.mute = false
        if (!('welcome' in chat)) chat.welcome = true
        if (!('detect' in chat)) chat.detect = true
        if (!('sWelcome' in chat)) chat.sWelcome = ''
        if (!('sBye' in chat)) chat.sBye = ''
        if (!('antibot' in chat)) chat.antibot = false
        if (!('antilink' in chat)) chat.antilink = true
        if (!('viewonce' in chat)) chat.viewonce = false
        if (!('antiToxic' in chat)) chat.antiToxic = false
        if (!('groupsewa' in chat)) chat.groupsewa = false
        if (!('nsfw' in chat)) chat.nsfw = false
        if (!('rpg' in chat)) chat.rpg = true
        if (!('game' in chat)) chat.game = true
        if (!('levelup' in chat)) chat.levelup = false
        if (!isNumber(chat.expired)) chat.expired = 0
        if (!('member' in chat)) chat.member = {}
    } else global.db.data.chats[m.chat] = {
        mute: false,
        welcome: true,
        detect: true,
        sWelcome: '',
        sBye: '',
        delete: true,
        antibot: false,
        antilink: false,
        viewonce: false,
        antiToxic: true,
        nsfw: false,
        rpg: true,
        game: true,
        levelup: false,
        expired: 0,
        member: {},
    }
    let settings = global.db.data.settings;
    if (typeof settings !== "object")
        global.db.data.settings = {};
    if (settings) {
        if (!("addReply" in settings)) settings.addReply = true;
        if (!("autodownload" in settings)) settings.autodownload = false;
        if (!('resetlimit' in settings)) settings.resetlimit = false;
        if (!("online" in settings)) settings.online = false;
        if (!("self" in settings)) settings.self = false;
        if (!("debug" in settings)) settings.debug = false;
        if (!("grouponly" in settings)) settings.grouponly = false;
        if (!("levelup" in settings)) settings.levelup = false
        if (!("blockcmd" in settings)) settings.blockcmd = [];
        if (!isNumber(settings.start)) settings.start = 0;
        if (!isNumber(settings.backupDB)) settings.backupDB = 0;
        if (!("backup" in settings)) settings.backup = true;
        if (!('toxic' in settings)) settings.toxic = ["ajg", "ajig", "anjg", "anjim", "anjing", "anjrot", "anying", "asw", "autis", "babi", "bacod", "bacot", "bagong", "bajingan", "bangsad", "bangsat", "bastard", "bego", "bgsd", "biadab", "biadap", "bitch", "bngst", "bodoh", "bokep", "cocote", "coli", "colmek", "comli", "dajjal", "dancok", "dongo", "fuck", "gelay", "goblog", "goblok", "guoblog", "guoblok", "hairul", "henceut", "idiot", "itil", "jamet", "jancok", "jembut", "jingan", "kafir", "kanjut", "kanyut", "keparat", "kntl", "kontol", "lana", "loli", "lont", "lonte", "mancing", "meki", "memek", "ngentod", "ngentot", "ngewe", "ngocok", "ngtd", "njeng", "njing", "njinx", "pantek", "pantek", "peler", "pepek", "pilat", "pler", "pornhub", "pucek", "puki", "pukimak", "redhub", "sange", "setan", "silit", "telaso", "tempek", "tete", "titit", "toket", "tolol", "tomlol", "tytyt", "tobrut"];
    } else
        global.db.data.settings = {
            addReply: true,
            autodownload: false,
            resetlimit: false,
            anticall: true,
            online: false,
            self: false,
            debug: false,
            grouponly: false,
            levelup: false,
            blockcmd: [],
            start: 0,
            backupDB: 0,
            backup: true,
            toxic: ["ajg", "ajig", "anjg", "anjim", "anjing", "anjrot", "anying", "asw", "autis", "babi", "bacod", "bacot", "bagong", "bajingan", "bangsad", "bangsat", "bastard", "bego", "bgsd", "biadab", "biadap", "bitch", "bngst", "bodoh", "bokep", "cocote", "coli", "colmek", "comli", "dajjal", "dancok", "dongo", "fuck", "gelay", "goblog", "goblok", "guoblog", "guoblok", "hairul", "henceut", "idiot", "itil", "jamet", "jancok", "jembut", "jingan", "kafir", "kanjut", "kanyut", "keparat", "kntl", "kontol", "lana", "loli", "lont", "lonte", "mancing", "meki", "memek", "ngentod", "ngentot", "ngewe", "ngocok", "ngtd", "njeng", "njing", "njinx", "pantek", "pantek", "peler", "pepek", "pilat", "pler", "pornhub", "pucek", "puki", "pukimak", "redhub", "sange", "setan", "silit", "telaso", "tempek", "tete", "titit", "toket", "tolol", "tomlol", "tytyt", "tobrut"]
        };
    let database = global.db.data.database;
    if (typeof database !== "object") global.db.data.database = {};
    if (database) {
        if (!("characterai" in database)) database.characterai = {};
        if (!("model" in database)) database.model = "";
        if (!("ratio" in database)) database.ratio = "portrait";
        if (!("sampler" in database)) database.sampler = "DPM++ 2S a Karras";
        if (!("confess" in database)) database.confess = {};
        if (!("sambungkata" in database)) database.sambungkata = {};
        if (!("listbot" in database)) database.listbot = {};
        if (!("menfes" in database)) database.menfes = {};
        if (!("menfess" in database)) database.menfess = {};
    } else global.db.data.database = {
        characterai: {},
        model: "",
        ratio: "portrait",
        sampler: "DPM++ 2S a Karras",
        confess: {},
        sambungkata: {},
        listbot: {},
        menfes: {},
        menfess: {}
    };
};


let fs = require("fs");
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    delete require.cache[file];
    require(file);
});
