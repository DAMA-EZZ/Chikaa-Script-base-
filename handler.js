const {
  Function: func,
  Scraper: scrape
} = new (require('chikaa-js'));
const util = require('util');
const baileys = require('@whiskeysockets/baileys');
const moment = require('moment-timezone');
const cron = require('node-cron');
const Scraper = new scrape
const Func = new func

const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))

module.exports = {
    async handler(chatUpdate) {
        conn.msgqueque = conn.msgqueque || [];
        if (!chatUpdate) return;
        conn.pushMessage(chatUpdate.messages).catch(console.error);
        let m = chatUpdate.messages[chatUpdate.messages.length - 1];
        if (!m) return;
        try {
            m = await require('./lib/serialize')(m, conn, store) || m;
            if (!m) return
            m.exp = 0
            m.limit = false
            try {
                require('./lib/database')(m);
            } catch (e) {
               // if (/(returnoverlimit|timed|timeout|users|item|time)/ig.test(e.message)) return
                console.error(e)
            }
            const users = global.db.data.users;
            const chats = global.db.data.chats
            const settings = global.db.data.settings;

            const isROwner = [
                conn.decodeJid(global.conn.user.id),
                ...global.owner.map((a) => a + "@s.whatsapp.net"),
            ].includes(m.sender);
            const isOwner = isROwner || m.fromMe;
            const isMods = users[m.sender].moderator;
            const isPrems = users[m.sender].premium;
            const isBans = users[m.sender].banned;
            if (m.isGroup) {
                db.data.chats[m.chat].chat += 1;
            }
            if (isROwner) {
                users[m.sender].premium = true;
                users[m.sender].premiumDate = "PERMANENT";
                users[m.sender].limit = "99999";
                users[m.sender].moderator = true;
            } else if (isPrems) {
                users[m.sender].limit = "999";
            } else if (!isROwner && isBans) return;

            if (opts["queque"] && m.text && !(isMods || isPrems)) {
                let queque = conn.msgqueque,
                    time = 1000 * 5;
                const previousID = queque[queque.length - 1];
                queque.push(m.id || m.key.id);
                setInterval(async function() {
                    if (queque.indexOf(previousID) === -1) clearInterval(conn);
                    else await delay(time);
                }, time);
            }

            users[m.sender].online = new Date() * 1;
            users[m.sender].chat += 1;

            if (settings.debug && !m.fromMe && isOwner) return conn.reply(m.chat, JSON.stringify(m, null, 2), m);
            if (opts["autoread"]) await conn.readMessages([m.key]);
            if (settings.self && !isOwner) return;
            if (settings.grouponly && !isPrems && !m.fromMe && !isOwner && !m.isGroup) return;

            if (typeof m.text !== "string") m.text = "";
            if (m.isBaileys && m.fromMe) return;
            m.exp += Math.ceil(Math.random() * 10);

            let usedPrefix;
            const groupMetadata =
                (m.isGroup ? (conn.chats[m.chat] || store.groupMetadata[m.chat]).metadata : {}) || {};
            const participants = (m.isGroup ? groupMetadata.participants : []) || [];
            const user =
                (m.isGroup ?
                    participants.find((u) => conn.decodeJid(u.id) === m.sender) : {}) || {};
            const bot =
                (m.isGroup ?
                    participants.find((u) => conn.decodeJid(u.id) == conn.user.jid) : {}) || {};
            const isRAdmin = (user && user.admin == "superadmin") || false;
            const isAdmin = isRAdmin || (user && user.admin == "admin") || false;
            const isBotAdmin = (bot && bot.admin) || false;
            const body = typeof m.text == 'string' ? m.text : false;
            cron.schedule("00 00 * * *", () => {
                let data = store.groupMetadata[idgc].participants.map(a => a.id).filter((user) => db.data.users[user]);
                let user = db.data.users;
                if (settings.resetlimit) {
                    for (let usr of data) {
                        user[usr].limit = global.limit;
                    }
                }
            }, {
                schedule: true,
                timezone: global.timezone
            });
            for (let name in global.plugins) {
                var plugin;
                if (typeof plugins[name].run === "function") {
                    var dama = plugins[name];
                    plugin = dama.run;
                    for (var prop in dama) {
                        if (prop !== "run") {
                            plugin[prop] = dama[prop];
                        }
                    }
                } else {
                    plugin = plugins[name];
                }
                if (!plugin) continue;
                if (plugin.disabled) continue;
                if (typeof plugin.all === "function") {
                    try {
                        await plugin.all.call(conn, m, chatUpdate);
                    } catch (e) {
                        // if (typeof e === 'string') continue
                        console.error(e);
                    }
                }
                const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
                let _prefix = conn.prefix ? conn.prefix : global.prefix
                let match = (_prefix instanceof RegExp ? // RegExp Mode?
                    [
                        [_prefix.exec(m.text), _prefix]
                    ] :
                    Array.isArray(_prefix) ? // Array?
                    _prefix.map(p => {
                        let re = p instanceof RegExp ? // RegExp in Array?
                            p :
                            new RegExp(str2Regex(p))
                        return [re.exec(m.text), re]
                    }) :
                    typeof _prefix === 'string' ? // String?
                    [
                        [new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]
                    ] : [
                        [
                            [], new RegExp
                        ]
                    ]
                ).find(p => p[1])
                if (typeof plugin.events === 'function') {
                    if (
                        plugin.events.call(conn, m, {
                            body,
                            Func,
                            Scraper,
                            match,
                            conn: conn,
                            participants,
                            groupMetadata,
                            user,
                            bot,
                            isROwner,
                            isOwner,
                            isAdmin,
                            isBotAdmin,
                            isPrems,
                            isBans,
                            chatUpdate,
                        })
                    )
                        continue
                }
                if (typeof plugin !== 'function') continue
                if (opts && match && m) {
                    let result = (match[0] || "")[0]
                    usedPrefix = result;
                    let noPrefix;
                    if (isOwner) {
                        noPrefix = !result ? m.text : m.text.replace(result, "");
                    } else {
                        noPrefix = !result ? "" : m.text.replace(result, "").trim();
                    }
                    let [command, ...args] = noPrefix.trim().split` `.filter((v) => v);
                    args = args || [];
                    let _args = noPrefix.trim().split` `.slice(1);
                    let text = _args.join` `;
                    command = (command || "").toLowerCase();
                    let fail = plugin.fail || global.dfail;
                    const prefixCommand = !result ? plugin.command :
                        plugin.command;
                    let isAccept =
                        (Array.isArray(prefixCommand) &&
                            prefixCommand.some((cmd) =>
                                cmd instanceof RegExp ? cmd.test(command) : cmd === command,
                            ));
                    usedPrefix = !result ? "" : result
                    if (!isAccept) continue
                    m.plugin = name
                    m.chatUpdate = chatUpdate;
                    let commands = Object.values(global.plugins)
                        .filter(v => v.command)
                        .map(v => v.command).flat(1);
                    if (m.chat in chats || m.sender in users) {
                        let chat = chats[m.chat]
                        let user = users[m.sender]
                        if (chat.mute && !isOwner) return
                        if (user.banned) return
                    }
                    if (commands.includes(command)) {
                        users.hit += 1
                        users.usebot = new Date() * 1
                        global.db.data.statistic = global.db.data.statistic ? global.db.data.statistic : {};
                        if (!global.db.data.statistic[command]) {
                            global.db.data.statistic[command] = {
                                hitstat: 1,
                                today: 1,
                                lasthit: new Date() * 1,
                                sender: m.sender.split`@` [0],
                            };
                        } else {
                            global.db.data.statistic[command].hitstat += 1;
                            global.db.data.statistic[command].today += 1;
                            global.db.data.statistic[command].lasthit = new Date() * 1;
                            global.db.data.statistic[command].sender = m.sender.split`@` [0];
                        }
                    }
                    if (plugin.restrict && text && new RegExp('\\b' + settings.toxic.join('\\b|\\b') + '\\b').test(text.toLowerCase())) {
                        m.reply(`You violated the bot's terms and conditions, if you repeat the same thing you will be banned.`)
                        continue;
                    };
                    if (settings.blockcmd.includes(command)) {
                        fail("block", m, conn);
                        continue;
                    }
                    if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
                        fail('owner', m, conn)
                        continue
                    }
                    if (plugin.rowner && !isROwner) {
                        fail('rowner', m, conn)
                        continue
                    }
                    if (plugin.owner && !isOwner) {
                        fail('owner', m, conn)
                        continue
                    }
                    if (plugin.mods && !isMods) {
                        fail('mods', m, conn)
                        continue
                    }
                    if (plugin.premium && !isPrems) {
                        fail('premium', m, conn)
                        continue
                    }
                    if (plugin.nsfw && !chats[m.chat].nsfw && m.isGroup) {
                        fail('nsfw', m, conn)
                        continue
                    }
                    if (plugin.game && !chats[m.chat].game && m.isGroup) {
                        fail('game', m, conn)
                        continue
                    }
                    if (plugin.rpg && !chats[m.chat].rpg && m.isGroup) {
                        fail('rpg', m, conn)
                        continue
                    }
                    if (plugin.group && !m.isGroup) {
                        fail('group', m, conn)
                        continue
                    } else if (plugin.botAdmin && !isBotAdmin) {
                        fail('botAdmin', m, conn)
                        continue
                    } else if (plugin.admin && !isAdmin && !isROwner) {
                        fail('admin', m, conn)
                        continue
                    }
                    if (plugin.private && m.isGroup) {
                        fail('private', m, conn)
                        continue
                    }
                    if (plugin.register == true && users[m.sender].registered == false) {
                        fail('unreg', m, conn)
                        continue
                    }
                    m.command = command
                    m.isCommand = true
                    let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17 // XP Earning per command
                    if (xp > 9999999999999999999999) m.reply('Ngecit -_-') // Hehehe
                    else m.exp += xp
                    if (!isPrems && plugin.limit && users[m.sender].limit < plugin.limit * 1) {
                        m.reply(`Limit anda telah habis, Upgrade *Premium* untuk unlimited limit.`)
                        continue
                    }
                    if (plugin.level > users[m.sender].level) {
                        m.reply(`diperlukan level ${plugin.level} untuk menggunakan perintah ini. Level kamu ${users[m.sender].level}`)
                        continue
                    }
                    let extra = {
                        match,
                        usedPrefix,
                        noPrefix,
                        args,
                        Func,
                        Scraper,
                        command,
                        text,
                        conn: conn,
                        participants,
                        groupMetadata,
                        user,
                        bot,
                        isROwner,
                        isOwner,
                        isAdmin,
                        isBotAdmin,
                        isPrems,
                        isBans,
                        chatUpdate,
                    }
                    try {
                        await plugin.call(conn, m, extra)
                        if (!isPrems) m.limit = m.limit || plugin.limit || false
                    } catch (e) {
                        console.error(e)
                        if (e) {
                            if (/(overlimit|timed|timeout|users|item|time)/ig.test(e.message)) return;
                            if (e.name) {
                                if (!m.isOwner) {
                                    for (let jid of global.owner) {
                                        let data = await conn.onWhatsApp(jid + "@s.whatsapp.net");
                                        if (!data[0].exists) continue;
                                        let message = ` – *[Error - Message]*\n`
                                        message += `- *Plugins :* ${m.plugin}\n`
                                        if (m.isGroup) {
                                            message += `- *Subject :* ${m.metadata.subject}\n`
                                        }
                                        message += `- *Sender :* @${m.sender.split`@`[0]}\n`
                                        message += `- *Command :* ${m.text}\n`
                                        message += `\n${Func.jsonFormat(e)}`
                                        conn.reply(jid + "@s.whatsapp.net", message, m)
                                    }
                                    m.reply(`*[ Error Message ] –* There was an error with the bot, please try again later`);
                                } else {
                                    m.reply(Func.jsonFormat(e))
                                }
                            } else {
                                m.reply(Func.jsonFormat(e))
                            }
                        }
                    } finally {
                        if (typeof plugin.after === 'function') {
                            try {
                                await plugin.after.call(conn, m, extra)
                            } catch (e) {
                                console.error(e)
                            }
                        }
                        //  if (m.limit) m.reply(+m.limit + ' Limit terpakai')
                    }
                    break
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            let user, stats = global.db.data.stats
            if (m) {
                if (m.sender && (user = global.db.data.users[m.sender])) {
                    user.exp += m.exp
                    user.limit -= m.limit * 1
                }
            }
            let stat;
            if (m.plugin) {
                let now = +new Date();
                if (m.plugin in stats) {
                    stat = stats[m.plugin];
                    if (!isNumber(stat.total)) stat.total = 1;
                    if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1;
                    if (!isNumber(stat.last)) stat.last = now;
                    if (!isNumber(stat.lastSuccess))
                        stat.lastSuccess = m.error != null ? 0 : now;
                } else
                    stat = stats[m.plugin] = {
                        total: 1,
                        success: m.error != null ? 0 : 1,
                        last: now,
                        lastSuccess: m.error != null ? 0 : now,
                    };
                stat.total += 1;
                stat.last = now;
                if (m.error == null) {
                    stat.success += 1;
                    stat.lastSuccess = now;
                }
            }
            try {
                require('./lib/system.js')(m, conn)
                require('./lib/print.js')(m, conn)
            } catch (e) {
                console.log(m, m.quoted, e)
            }
            if (opts['autoread']) await conn.readMessages([m.key])
        }
    },
    async participantsUpdate({
        id,
        participants,
        action
    }) {
        if (global.db.data.settings.self) return
        let chat = db.data.chats[id] || {}
        if (chat.mute) return
        let text = ''
        switch (action) {
            case "add":
            case "remove":
                if (chat.welcome) {
                    let groupMetadata =
                        (await conn.groupMetadata(id)) || (conn.chats[id] || {}).metadata;
                    for (let user of participants) {
                        //let pp = "https://i.ibb.co/sQTkHLD/ppkosong.png";
                        let name = await conn.getName(user);
                        let gpname = await conn.getName(id);
                        let pp
                        try {
                            pp = await conn.profilePictureUrl(user, "image");
                        } catch {
                            pp = await conn.profilePictureUrl(id, "image").catch(_ => thumb);
                        } finally {
                            text = (action === 'add' ? (chat.sWelcome || 'Welcome @user 👋🏻').replace('@subject', await conn.getName(id)).replace('@desc', groupMetadata.desc ? String.fromCharCode(8206).repeat(4001) + groupMetadata.desc : '') :
                                (chat.sBye || 'Good Byee @user 👋🏻')).replace('@user', "@" + user.split("@")[0])
                            conn.sendMessage(id, {
                                text: text,
                                contextInfo: {
                                    mentionedJid: [user],
                                    groupMentions: [],
                                    isForwarded: true,
                                    forwardedNewsletterMessageInfo: {
                                        newsletterJid: idch,
                                        newsletterName: botname,
                                        serverMessageId: -1
                                    },
                                    forwardingScore: 4,
                                    externalAdReply: {
                                        title: gpname,
                                        body: ``,
                                        thumbnailUrl: pp,
                                        sourceUrl: sgc,
                                        mediaType: 1,
                                        renderLargerThumbnail: true
                                    }
                                }
                            }, {
                                quoted: null
                            })
                        }
                    }
                }
                break;
        }
    }
}

global.dfail = async (type, m, conn) => {
    let msg = {
        rowner: 'Sorry, you cannot access this command.',
        owner: 'Sorry, you cannot access this command.',
        mods: 'Sorry, you cannot access this command.',
        premium: 'This command can only be used by *Premium* users.',
        group: 'This command can only be used within *Group*',
        private: 'This command can only be used in *Private* chat.',
        admin: 'This command can only be used by the *Admin* group.',
        botAdmin: 'Make *Ichika* Admin to use this command.',
        unreg: `You can't use the bot before registering, please follow the following command\n\n• *Example* : .daftar nama.umur`,
        restrict: 'This feature is *Disable*',
        nsfw: '*NSFW* is disabled in the group',
        game: '*Game* is disabled in the group',
        rpg: '*RPG* is disabled in the group',
        block: 'Sorry, this command is disabled',
    } [type]
    if (msg) return conn.sendMessage(m.chat, {
        document: fs.readFileSync('./null.js'),
        fileName: botname,
        jpegThumbnail: await conn.resize(fs.readFileSync('./thumb.jpg'), 350, 190),
        mimetype: 'application/msword',
        caption: msg,
        sendEphemeral: true,
        contextInfo: {
            mentionedJid: [m.sender],
            isForwarded: true,
            forwardingScore: 5,
            forwardedNewsletterMessageInfo: {
                newsletterJid: idch,
                newsletterName: botname,
                serverMessageId: -1,
            },
        },
    }, {
        quoted: m
    })
}

let fs = require('fs')
let chalk = require('chalk')
let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright("Update 'handler.js'"))
    delete require.cache[file]
    if (global.reloadHandler) console.log(global.reloadHandler())
})