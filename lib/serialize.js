const {
    jidNormalizedUser,
    extractMessageContent,
    downloadMediaMessage,
    proto,
    areJidsSameUser,
    generateWAMessage,
    WAMessageStubType
} = require('@whiskeysockets/baileys');
const {
    Extra
} = new (require('chikaa-js'));
const axios = require('axios');
const fs = require('fs');
const util = require("util");

const getContentType = content => {
    if (content) {
        const keys = Object.keys(content);
        const key = keys.find(k => (k === 'conversation' || k.endsWith('Message') || k.includes('V2') || k.includes('V3')) && k !== 'senderKeyDistributionMessage');
        return key;
    }
};

function escapeRegExp(string) {
    return string.replace(/[.*=+:\-?^${}()|[\]\\]|\s/g, '\\$&');
}

function parseMessage(content) {
    content = extractMessageContent(content);
    if (content && content.viewOnceMessageV2Extension) {
        content = content.viewOnceMessageV2Extension.message;
    }
    if (content && content.protocolMessage && content.protocolMessage.type == 14) {
        let type = getContentType(content.protocolMessage);
        content = content.protocolMessage[type];
    }
    if (content && content.message) {
        let type = getContentType(content.message);
        content = content.message[type];
    }
    Extra.Prototype()
    return content;
}


module.exports = async (messages, conn, store) => {
    const m = {}
    if (!messages) return;
    m.message = parseMessage(messages.message);
    if (messages.key) {
        m.key = messages.key;
        m.chat = m.key.remoteJid.startsWith('status') ? jidNormalizedUser(m.key?.participant || messages.participant) : jidNormalizedUser(m.key.remoteJid);
        m.fromMe = m.key.fromMe;
        m.id = m.key.id;
        m.device = /^3A/.test(m.id) ? 'ios' : m.id.startsWith('3EB') ? 'web' : /^.{21}/.test(m.id) ? 'android' : /^.{18}/.test(m.id) ? 'desktop' : 'unknown';
        m.isBaileys = m.id ? m.id.startsWith('3EB0') || m.id.startsWith('BAE5') || m.id.startsWith('HSK') || m.id.startsWith('SSA') || m.id.startsWith('NEK0') ||(m.id.indexOf("LTS-") > 1) || m.id.startsWith('NXR') || m.id.startsWith('FELZ') : false;
        m.isGroup = m.chat.endsWith('@g.us');
        m.participant = jidNormalizedUser(messages?.participant || m.key.participant) || false;
        m.sender = jidNormalizedUser(m.fromMe ? conn.user.id : m.isGroup ? m.participant : m.chat);
        if (messages.messageStubType) {
            m.messageStubParameters = messages.messageStubParameters;
            m.messageStubType = messages.messageStubType;
            m.type = WAMessageStubType[m.messageStubType];
        }
    }
    if (m.isGroup) {
        if (!(m.chat in store.groupMetadata)) store.groupMetadata[m.chat] = await conn.groupMetadata(m.chat);
        m.metadata = store.groupMetadata[m.chat];
        m.groupAdmins = m.isGroup && m.metadata.participants.reduce((memberAdmin, memberNow) => (memberNow.admin ? memberAdmin.push({
            id: memberNow.id,
            admin: memberNow.admin
        }) : [...memberAdmin]) && memberAdmin, []);
        m.isAdmin = m.isGroup && !!m.groupAdmins.find(member => member.id === m.sender);
        m.isBotAdmin = m.isGroup && !!m.groupAdmins.find(member => member.id === jidNormalizedUser(conn.user.id));
    }
    m.name = messages.pushName;
    if (m.message) {
        m.mtype = getContentType(m.message) || Object.keys(m.message)[0];
        m.msg = parseMessage(m.message[m.mtype]) || m.message[m.mtype];
        m.mentions = m.mentionedJid = [...(m.msg?.contextInfo?.mentionedJid || []), ...(m.msg?.contextInfo?.groupMentions?.map(v => v.groupJid) || [])];
        m.text = m.msg?.text || m.msg?.conversation || m.msg?.caption || m.message?.conversation || m.msg?.selectedButtonId || m.msg?.singleSelectReply?.selectedRowId || m.msg?.selectedId || m.msg?.contentText || m.msg?.selectedDisplayText || m.msg?.title || m.msg?.name || '';
        m.prefix = new RegExp('^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]', 'gi').test(m.text) ? m.text.match(new RegExp('^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]', 'gi'))[0] : '';
        m.command = m.text && m.text.trim().replace(m.prefix, '').trim().split(/ +/).shift();
        m.args =
            m.text
            .trim()
            .replace(new RegExp('^' + escapeRegExp(m.prefix), 'i'), '')
            .replace(m.command, '')
            .split(/ +/)
            .filter(a => a) || [];
        m.input = m.args.join(' ').trim();
        m.isOwner = [
            conn.decodeJid(conn.user.id),
            ...global.owner.map((a) => a + "@s.whatsapp.net"),
        ].includes(m.sender);
        m.expiration = m.msg?.contextInfo?.expiration || 0;
        m.timestamps = typeof messages.messageTimestamp === 'number' ? messages.messageTimestamp * 1000 : m.msg.timestampMs * 1000;
        m.isMedia = !!m.msg?.mimetype || !!m.msg?.thumbnailDirectPath;

        m.isQuoted = false;
        if (m.msg?.contextInfo?.quotedMessage) {
            m.isQuoted = true;
            m.quoted = {};
            m.quoted.message = parseMessage(m.msg?.contextInfo?.quotedMessage);

            if (m.quoted.message) {
                m.quoted.mtype = getContentType(m.quoted.message) || Object.keys(m.quoted.message)[0];
                m.quoted.msg = parseMessage(m.quoted.message[m.quoted.mtype]) || m.quoted.message[m.quoted.mtype];
                m.quoted.key = {
                    remoteJid: m.msg?.contextInfo?.remoteJid || m.chat,
                    participant: jidNormalizedUser(m.msg?.contextInfo?.participant),
                    fromMe: areJidsSameUser(jidNormalizedUser(m.msg?.contextInfo?.participant), jidNormalizedUser(conn?.user?.id)),
                    id: m.msg?.contextInfo?.stanzaId,
                };
                m.quoted.chat = /g\.us|status/.test(m.msg?.contextInfo?.remoteJid) ? m.quoted.key.participant : m.quoted.key.remoteJid;
                m.quoted.fromMe = m.quoted.key.fromMe;
                m.quoted.id = m.msg?.contextInfo?.stanzaId;
                m.quoted.device = /^3A/.test(m.quoted.id) ? 'ios' : /^3E/.test(m.quoted.id) ? 'web' : /^.{21}/.test(m.quoted.id) ? 'android' : /^.{18}/.test(m.quoted.id) ? 'desktop' : 'unknown';
                m.quoted.isMedia = !!m.quoted.msg?.mimetype || !!m.quoted.msg?.thumbnailDirectPath;
                m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('3EB0') || m.quoted.id.startsWith('BAE5') || m.quoted.id.startsWith('HSK') || (m.quoted.id.indexOf("LTS-") > 1) || m.quoted.id.startsWith('SSA') || m.quoted.id.startsWith('NEK0') || m.quoted.id.startsWith('NXR') || m.quoted.id.startsWith('FELZ') : false;
                m.quoted.isGroup = m.quoted.chat.endsWith('@g.us');
                m.quoted.participant = jidNormalizedUser(m.msg?.contextInfo?.participant) || false;
                m.quoted.sender = jidNormalizedUser(m.msg?.contextInfo?.participant || m.quoted.chat);
                m.quoted.mentions = [...(m.quoted.msg?.contextInfo?.mentionedJid || []), ...(m.quoted.msg?.contextInfo?.groupMentions?.map(v => v.groupJid) || [])];
                m.quoted.text = m.quoted.msg?.text || m.quoted.msg?.caption || m.quoted?.message?.conversation || m.quoted.msg?.selectedButtonId || m.quoted.msg?.singleSelectReply?.selectedRowId || m.quoted.msg?.selectedId || m.quoted.msg?.contentText || m.quoted.msg?.selectedDisplayText || m.quoted.msg?.title || m.quoted?.msg?.name || '';
                m.quoted.prefix = new RegExp('^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]', 'gi').test(m.quoted.text) ? m.quoted.text.match(new RegExp('^[°•π÷×¶∆£¢€¥®™+✓=|/~!?@#%^&.©^]', 'gi'))[0] : '';
                m.quoted.command = m.quoted.text && m.quoted.text.replace(m.quoted.prefix, '').trim().split(/ +/).shift();
                m.quoted.args =
                    m.quoted.text
                    .trim()
                    .replace(new RegExp('^' + escapeRegExp(m.quoted.prefix), 'i'), '')
                    .replace(m.quoted.command, '')
                    .split(/ +/)
                    .filter(a => a) || [];
                m.quoted.input = m.quoted.args.join(' ').trim() || m.quoted.text;
                m.quoted.isOwner = [
                    conn.decodeJid(conn.user.id),
                    ...global.owner.map((a) => a + "@s.whatsapp.net"),
                ].includes(m.quoted.sender);
                if (m.quoted.isMedia) {
                    m.quoted.download = (saveToFile = false) => {
                        return conn.downloadM(m.quoted.msg, m.quoted.mtype.replace(/message/i, ""), saveToFile);
                    }
                }
                m.quoted.react = async (emot) => {
                    await conn.sendMessage(m.chat, {
                        react: {
                            text: emot,
                            key: m.quoted.key
                        }
                    })
                }
                m.quoted.reply = (text, chatId, options) =>
                    conn.reply(chatId ? chatId : m.chat, text, m.quoted, options);
               // m.quoted.copy = () => exports.smsg(messages, conn, store);
                m.quoted.forward = (jid, forceForward = false) =>
                    conn.forwardMessage(jid, m.quoted.msg, forceForward);
                m.quoted.copyNForward = (jid, forceForward = true, options = {}) =>
                    conn.copyNForward(jid, m.quoted.message, forceForward, options);
                m.quoted.cMod = (
                    jid,
                    text = "",
                    sender = m.quoted.sender,
                    options = {},
                ) => conn.cMod(jid, m.quoted.msg, text, sender, options);

                m.quoted.delete = () =>
                    conn.sendMessage(m.chat, {
                        delete: m.quoted.key
                    });

            }
        }
    }
    if (m.isMedia) {
        m.download = (saveToFile = false) => {
            return conn.downloadM(m.msg, m.mtype.replace(/message/i, ""), saveToFile);
        }
    }
   // m.copy = () => exports.smsg(messages, conn, store, config);
    m.forward = (jid, forceForward = false) =>
        conn.forwardMessage(jid, m.msg, forceForward);
    m.copyNForward = (jid, forceForward = true, options = {}) =>
        conn.copyNForward(jid, m.message, forceForward, options);
    m.cMod = (
        jid,
        text = "",
        sender = m.sender,
        options = {},
    ) => conn.cMod(jid, m.quoted.msg, text, sender, options);

    m.reply = async (text, chatId, options) => {
        global.db.data.settings.addReply ? await conn.sendMessage(chatId ? chatId : m.chat, {
            document: await fs.readFileSync('./null.js'),
            fileName: botname,
            jpegThumbnail: await conn.resize(fs.readFileSync('./thumbnail.jpg'), 400, 400),
            mimetype: 'image/jpeg',
            caption: text,
            sendEphemeral: true,
            contextInfo: {
                mentionedJid: await conn.parseMention(text),
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
        }) : conn.reply(chatId ? chatId : m.chat, text, m, options);
    }
    m.react = async (emoji) => {
        await conn.sendMessage(m.chat, {
            react: {
                text: emoji,
                key: m.key,
            },
        });
    };
    m.emit = async (text) => {
        let messages = await generateWAMessage(
            m.key.remoteJid, {
                text: text,
                mentions: m.mentions,
            }, {
                quoted: m.quoted,
            },
        );
        messages.key.fromMe = areJidsSameUser(m.sender, sock.user.id);
        messages.key.id = m.key.id;
        messages.pushName = m.name;
        if (m.isGroup) messages.participant = m.sender;
        let msg = {
            ...m,
            messages: [proto.WebMessageInfo.fromObject(messages)],
            type: "append",
        };
        return conn.ev.emit("messages.upsert", msg);
    };
    return m;
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    delete require.cache[file];
    require(file);
});