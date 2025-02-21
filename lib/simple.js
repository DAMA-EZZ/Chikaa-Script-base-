const {
    default: makeWASocket,
    makeWALegacySocket,
    extractMessageContent,
    makeInMemoryStore,
    proto,
    prepareWAMessageMedia,
    downloadContentFromMessage,
    getBinaryNodeChild,
    jidDecode,
    generateWAMessage,
    generateMessageIDV2,
    areJidsSameUser,
    jidNormalizedUser,
    STORIES_JID,
    generateForwardMessageContent,
    generateWAMessageFromContent,
    WAMessageStubType,
    WA_DEFAULT_EPHEMERAL,
} = require("@whiskeysockets/baileys");
const {
    imageToWebp,
    videoToWebp,
    writeExifImg,
    writeExifVid
} = (new (require('chikaa-js'))).Exif
const {
    randomBytes
} = require('crypto');
const chalk = require('chalk')
const fetch = require('node-fetch')
const FileType = require('file-type')
const PhoneNumber = require('awesome-phonenumber')
const fs = require('fs')
const path = require('path')
const jimp = require('jimp')
const pino = require('pino')
const util = require('util')

exports.makeWASocket = (connectionOptions, options = {}) => {
    let conn = (opts['legacy'] ? makeWALegacySocket : makeWASocket)(connectionOptions)
    conn.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }
    if (conn.user && conn.user.id) conn.user.jid = conn.decodeJid(conn.user.id)
    if (!conn.chats) conn.chats = {}

    conn.ev.on('chats.set', async ({
        chats
    }) => {
        for (const {
                id,
                name,
                readOnly
            }
            of chats) {
            id = conn.decodeJid(id)
            if (!id) continue
            const isGroup = id.endsWith('@g.us')
            let chats = conn.chats[id]
            if (!chats) chats = conn.chats[id] = {
                id
            }
            chats.isChats = !readOnly
            if (name) chats[isGroup ? 'subject' : 'name'] = name
            if (isGroup) {
                const metadata = await conn.groupMetadata(id).catch(_ => null)
                if (!metadata) continue
                chats.subject = name || metadata.subject
                chats.metadata = metadata
            }
        }
    })
    conn.ev.on('chats.upsert', async function chatsUpsertPushToDb(chatsUpsert) {
        console.log({
            chatsUpsert
        })
        const {
            id,
            name
        } = chatsUpsert
        if (!id) return
        let chats = conn.chats[id] = {
            ...conn.chats[id],
            ...chatsUpsert,
            isChats: true
        }
        const isGroup = id.endsWith('@g.us')
        if (isGroup) {
            const metadata = await conn.groupMetadata(id).catch(_ => null)
            if (metadata) {
                chats.subject = name || metadata.subject
                chats.metadata = metadata
            }
            const groups = await conn.groupFetchAllParticipating().catch(_ => ({})) || {}
            for (const group in groups) conn.chats[group] = {
                id: group,
                subject: groups[group].subject,
                isChats: true,
                metadata: groups[group]
            }
        }
    })

    conn.sendButtonMessage = async (jid, array, quoted, json = {}, options = {}) => {
        const result = [];

        for (const data of array) {
            if (data.type === "reply") {
                for (const pair of data.value) {
                    result.push({
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                            display_text: pair[0],
                            id: pair[1],
                        }),
                    });
                }
            } else if (data.type === "url") {
                for (const pair of data.value) {
                    result.push({
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                            display_text: pair[0],
                            url: pair[1],
                            merBott_url: pair[1],
                        }),
                    });
                }
            } else if (data.type === "copy") {
                for (const pair of data.value) {
                    result.push({
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                            display_text: pair[0],
                            copy_code: pair[1],
                        }),
                    });
                }
            } else if (data.type === "list") {
                let transformedData = data.value.map((item) => ({
                    ...(item.headers ? {
                        title: item.headers
                    } : {}),
                    rows: item.rows.map((row) => ({
                        header: row.headers,
                        title: row.title,
                        description: row.body,
                        id: row.command,
                    })),
                }));

                let sections = transformedData;
                const listMessage = {
                    title: data.title,
                    sections,
                };
                result.push({
                    name: "single_select",
                    buttonParamsJson: JSON.stringify(listMessage),
                });
            }
        }

        let msg;
        if (json.url) {
            let file = await conn.getFile(json.url);
            let mime = file.mime.split("/")[0];
            let mediaMessage = await prepareWAMessageMedia({
                ...(mime === "image" ? {
                        image: file.data
                    } :
                    mime === "video" ? {
                        video: file.data
                    } : {
                        document: file.data,
                        mimetype: file.mime,
                        fileName: json.filename || "AkiraaBot." + extension(file.mime)
                    }),
            }, {
                upload: conn.waUploadToServer
            });

            msg = generateWAMessageFromContent(
                jid, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },
                            interactiveMessage: proto.Message.InteractiveMessage.create({
                                body: proto.Message.InteractiveMessage.Body.create({
                                    text: json.body
                                }),
                                footer: proto.Message.InteractiveMessage.Footer.create({
                                    text: json.footer
                                }),
                                header: proto.Message.InteractiveMessage.Header.create({
                                    hasMediaAttachment: true,
                                    ...mediaMessage
                                }),
                                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                    buttons: result,
                                }),
                                ...options
                            }),
                        },
                    },
                }, {
                    userJid: conn.user.jid,
                    quoted,
                    upload: conn.waUploadToServer,
                    ...ephemeral,
                }
            );
        } else {
            msg = generateWAMessageFromContent(
                jid, {
                    viewOnceMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: {},
                                deviceListMetadataVersion: 2
                            },
                            interactiveMessage: proto.Message.InteractiveMessage.create({
                                body: proto.Message.InteractiveMessage.Body.create({
                                    text: json.body
                                }),
                                footer: proto.Message.InteractiveMessage.Footer.create({
                                    text: json.footer
                                }),
                                header: proto.Message.InteractiveMessage.Header.create({
                                    hasMediaAttachment: false
                                }),
                                nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                    buttons: result.length > 0 ? result : [{
                                        text: ""
                                    }],
                                }),
                                ...options
                            }),
                        },
                    },
                }, {
                    userJid: conn.user.jid,
                    quoted,
                    upload: conn.waUploadToServer,
                    ...ephemeral,
                }
            );
        }
        await conn.sendPresenceUpdate('composing', msg.key.remoteJid)
        await conn.relayMessage(msg.key.remoteJid, msg.message, {
            messageId: msg.key.id
        });
        return msg;
    };

    conn.sendAI = async (chatId, text) => {
        const stanza = []
        stanza.push({
            attrs: {
                biz_bot: '1'
            },
            tag: "bot"
        });
        stanza.push({
            attrs: {},
            tag: "biz"
        });
        const gen = {
            conversation: text,
            messageContextInfo: {
                messageSecret: randomBytes(32),
                supportPayload: JSON.stringify({
                    version: 1,
                    is_ai_message: true,
                    should_show_system_message: true,
                    ticket_id: "1669945700536053"
                })
            }
        };
        await conn.sendPresenceUpdate('composing', chatId)
        await conn.relayMessage(chatId, gen, {
            messageId: generateMessageIDV2(conn.user?.id),
            additionalNodes: stanza
        });
    }

    const fetchParticipants = async (...jids) => {
        let results = [];
        for (const jid of jids) {
            let {
                participants
            } = await conn.groupMetadata(jid);
            participants = participants.map(({
                id
            }) => id);
            results = results.concat(participants);
        }
        return results;
    };
    conn.sendStatus = async (content, jids) => {
        const msg = await generateWAMessage(STORIES_JID, content, {
            upload: conn.waUploadToServer
        });

        let statusJidList = [];
        for (const _jid of jids) {
            if (_jid.endsWith("@g.us")) {
                for (const jid of await fetchParticipants(_jid)) {
                    statusJidList.push(jid);
                }
            } else {
                statusJidList.push(_jid);
            }
        }
        statusJidList = [
            ...new Set(
                statusJidList
            )
        ];

        await conn.relayMessage(msg.key.remoteJid, msg.message, {
            messageId: msg.key.id,
            statusJidList,
            additionalNodes: [{
                tag: "meta",
                attrs: {},
                content: [{
                    tag: "mentioned_users",
                    attrs: {},
                    content: jids.map((jid) => ({
                        tag: "to",
                        attrs: {
                            jid
                        },
                        content: undefined
                    }))
                }]
            }]
        });

        for (const jid of jids) {
            let type = (
                jid.endsWith("@g.us") ? "groupStatusMentionMessage" :
                "statusMentionMessage"
            );
            await conn.relayMessage(jid, {
                [type]: {
                    message: {
                        protocolMessage: {
                            key: msg.key,
                            type: 25
                        }
                    }
                }
            }, {
                additionalNodes: [{
                    tag: "meta",
                    attrs: {
                        is_status_mention: "true"
                    },
                    content: undefined
                }]
            });
        }
        return msg;
    }

    conn.logger = {
        ...conn.logger,
        info(...args) {
            console.log(chalk.bold.rgb(57, 183, 16)(`INFO [${chalk.rgb(255, 255, 255)(new Date())}]:`), chalk.cyan(util.format(...args)))
        },
        error(...args) {
            console.log(chalk.bold.rgb(247, 38, 33)(`ERROR [${chalk.rgb(255, 255, 255)(new Date())}]:`), chalk.rgb(255, 38, 0)(util.format(...args)))
        },
        warn(...args) {
            console.log(chalk.bold.rgb(239, 225, 3)(`WARNING [${chalk.rgb(255, 255, 255)(new Date())}]:`), chalk.keyword('orange')(util.format(...args)))
        }
    }

    conn.appendTextMessage = async (m, text, chatUpdate) => {
        let messages = await generateWAMessage(
            m.chat, {
                text: text,
                mentions: m.mentionedJid,
            }, {
                userJid: conn.user.id,
                quoted: m.quoted && m.quoted.fakeObj,
            },
        );
        messages.key.fromMe = areJidsSameUser(m.sender, conn.user.id);
        messages.key.id = m.key.id;
        messages.pushName = m.pushName;
        if (m.isGroup) messages.participant = m.sender;
        let msg = {
            ...chatUpdate,
            messages: [proto.WebMessageInfo.fromObject(messages)],
            type: "append",
        };
        await conn.sendPresenceUpdate('composing', m.chat)
        conn.ev.emit("messages.upsert", msg);
        return m;
    };

    conn.sendReact = async (jid, emoticon, keys = {}) => {
        let reactionMessage = {
            react: {
                text: emoticon,
                key: keys
            }
        }
        return await conn.sendMessage(jid, reactionMessage)
    }

    conn.getFile = async (PATH, returnAsFilename) => {
        let res, filename
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
        if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
        let type = await FileType.fromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        }
        if (data && returnAsFilename && !filename)(filename = path.join(__dirname, '../tmp/' + new Date * 1 + '.' + type.ext), await fs.promises.writeFile(filename, data))
        return {
            res,
            filename,
            ...type,
            data
        }
    }

    conn.waitEvent = (eventName, is = () => true, maxTries = 25) => {
        return new Promise((resolve, reject) => {
            let tries = 0
            let on = (...args) => {
                if (++tries > maxTries) reject('Max tries reached')
                else if (is()) {
                    conn.ev.off(eventName, on)
                    resolve(...args)
                }
            }
            conn.ev.on(eventName, on)
        })
    }

    conn.filter = (text) => {
        let mati = ["q", "w", "r", "t", "y", "p", "s", "d", "f", "g", "h", "j", "k", "l", "z", "x", "c", "v", "b", "n", "m"]
        if (/[aiueo][aiueo]([qwrtypsdfghjklzxcvbnm])?$/i.test(text)) return text.substring(text.length - 1)
        else {
            let res = Array.from(text).filter(v => mati.includes(v))
            let resu = res[res.length - 1]
            for (let huruf of mati) {
                if (text.endsWith(huruf)) {
                    resu = res[res.length - 2]
                }
            }
            let misah = text.split(resu)
            return resu + misah[misah.length - 1]
        }
    }

    conn.resize = async (buffer, uk1, uk2) => {
        return new Promise(async (resolve, reject) => {
            var baper = await jimp.read(buffer);
            var ab = await baper.resize(uk1, uk2).getBufferAsync(jimp.MIME_JPEG)
            resolve(ab)
        })
    }

    conn.getFile = async (PATH, returnAsFilename) => {
        let res, filename
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,` [1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
        if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
        let type = await FileType.fromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        }
        if (data && returnAsFilename && !filename)(filename = path.join(__dirname, '../tmp/' + new Date * 1 + '.' + type.ext), await fs.promises.writeFile(filename, data))
        return {
            res,
            filename,
            ...type,
            data
        }
    }

    conn.sendFile = async (jid, media, filename = null, caption = null, quoted = null, options = {}) => {
        let buffer;
        let mimeType;
        let ext;
        let data = await conn.getFile(media);
        buffer = data.data;
        mimeType = data.mime || "application/octet-stream";
        ext = data.ext || ".tmp";
        let isSticker = false;
        if (data.ext === "webp") (isSticker = true);
        if (options && options.document) {
            await conn.sendPresenceUpdate('composing', jid)
            return conn.sendMessage(
                jid, {
                    document: buffer,
                    fileName: filename || "file." + ext,
                    caption: caption,
                    mimetype: mimeType,
                    ...options,
                }, {
                    quoted: quoted
                },
            );
        } else if (/webp/.test(mimeType)) {
            await conn.sendPresenceUpdate('recording', jid)
            return conn.sendMessage(
                jid, {
                    sticker: buffer,
                    mimetype: mimeType,
                    ...options,
                }, {
                    quoted: quoted
                },
            );
        } else if (/image/.test(mimeType) && !isSticker) {
            await conn.sendPresenceUpdate('composing', jid)
            return conn.sendMessage(
                jid, {
                    image: buffer,
                    mimetype: mimeType,
                    caption: caption,
                    ...options,
                }, {
                    quoted: quoted
                },
            );
        } else if (/video/.test(mimeType)) {
            await conn.sendPresenceUpdate('composing', jid)
            return conn.sendMessage(
                jid, {
                    video: buffer,
                    mimetype: mimeType,
                    caption: caption,
                    ...options,
                }, {
                    quoted: quoted
                },
            );
        } else if (/audio/.test(mimeType)) {
            await conn.sendPresenceUpdate('recording', jid)
            return conn.sendMessage(
                jid, {
                    audio: buffer,
                    ...options,
                }, {
                    quoted: quoted
                },
            );
        } else {
            await conn.sendPresenceUpdate('composing', jid)
            return conn.sendMessage(
                jid, {
                    document: buffer,
                    fileName: filename || "file." + ext,
                    mimetype: mimeType,
                    caption: caption,
                    ...options,
                }, {
                    quoted: quoted
                },
            );
        }
    };

    conn.sendSticker = async (jid, path, quoted, options = {}) => {
        let buffer = /^https?:\/\//.test(path) ? await (await fetch(path)).buffer() : Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,` [1], 'base64') : Buffer.alloc(0)
        const {
            ext,
            mime,
        } = await FileType.fromBuffer(buffer)
        const media = /webp/.test(mime)
            ? buffer
            : /image/.test(mime)
                ? await imageToWebp(buffer)
                : /video/.test(mime)
                    ? await videoToWebp(buffer)
                    : ""
        let convert = /image/.test(mime) 
            ? await writeExifImg(buffer, options) 
            : await writeExifVid(buffer, options)
        await conn.sendPresenceUpdate('composing', jid)
        return conn.sendMessage(jid, {
            sticker: {
                url: convert
            },
            ...options
        }, {
            quoted
        })
    }

    conn.sendContact = async (jid, data, quoted, options) => {
        let contacts = []
        for (let [number, name] of data) {
            number = number.replace(/[^0-9]/g, '')
            let njid = number + '@s.whatsapp.net'
            let biz = await conn.getBusinessProfile(njid) || {}
            // N:;${name.replace(/\n/g, '\\n').split(' ').reverse().join(';')};;;
            let vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${name.replace(/\n/g, '\\n')}
item1.TEL;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}
item1.X-ABLabel:Ponsel${biz.description ? `
PHOTO;BASE64:${(await conn.getFile(await conn.profilePictureUrl(njid)).catch(_ => ({})) || {}).data?.toString('base64')}
X-WA-BIZ-DESCRIPTION:${(biz.description || '').replace(/\n/g, '\\n')}
X-WA-BIZ-NAME:${(((conn.chats[njid] || {}) || { vname: conn.chats[njid]?.name }).vname || conn.getName(njid) || name).replace(/\n/, '\\n')}
`.trim() : ''}
END:VCARD
`.trim()
            contacts.push({
                vcard,
                displayName: name
            })

        }
        return await conn.sendMessage(jid, {
            contacts: {
                ...options,
                displayName: (contacts.length > 1 ? `${contacts.length} kontak` : contacts[0].displayName) || null,
                contacts,
            },
            quoted,
            ...options
        })
    }

    conn.reply = async (jid, text = '', quoted, options) => {
        await conn.sendPresenceUpdate('composing', jid)
        return conn.sendMessage(jid, {
            text,
            mentions: conn.parseMention(text),
            ...options
        }, {
            quoted,
        })
    }

    conn.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    conn.cMod = async (jid, message, text = '', sender = conn.user.jid, options = {}) => {
        if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions]
        let copy = message.toJSON()
        delete copy.message.messageContextInfo
        delete copy.message.senderKeyDistributionMessage
        let mtype = Object.keys(copy.message)[0]
        let msg = copy.message
        let content = msg[mtype]
        if (typeof content === 'string') msg[mtype] = text || content
        else if (content.caption) content.caption = text || content.caption
        else if (content.text) content.text = text || content.text
        if (typeof content !== 'string') {
            msg[mtype] = {
                ...content,
                ...options
            }
            msg[mtype].contextInfo = {
                ...(content.contextInfo || {}),
                mentionedJid: options.mentions || content.contextInfo?.mentionedJid || []
            }
        }
        if (copy.participant) sender = copy.participant = sender || copy.participant
        else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
        if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
        else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
        copy.key.remoteJid = jid
        copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false
        return proto.WebMessageInfo.fromObject(copy)
    }

    conn.cMods = (jid, message, text = '', sender = conn.user.jid, options = {}) => {
        let copy = message.toJSON()
        let mtype = Object.keys(copy.message)[0]
        let isEphemeral = false // mtype === 'ephemeralMessage'
        if (isEphemeral) {
            mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
        let content = msg[mtype]
        if (typeof content === 'string') msg[mtype] = text || content
        else if (content.caption) content.caption = text || content.caption
        else if (content.text) content.text = text || content.text
        if (typeof content !== 'string') msg[mtype] = {
            ...content,
            ...options
        }
        if (copy.participant) sender = copy.participant = sender || copy.participant
        else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
        if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
        else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
        copy.key.remoteJid = jid
        copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false
        return proto.WebMessageInfo.fromObject(copy)
    }

    conn.copyNForward = async (jid, message, forwardingScore = true, options = {}) => {
        let m = generateForwardMessageContent(message, !!forwardingScore)
        let mtype = Object.keys(m)[0]
        if (forwardingScore && typeof forwardingScore == 'number' && forwardingScore > 1) m[mtype].contextInfo.forwardingScore += forwardingScore
        m = generateWAMessageFromContent(jid, m, {
            ...options,
            userJid: conn.user.id
        })
        await conn.relayMessage(jid, m.message, {
            messageId: m.key.id,
            additionalAttributes: {
                ...options
            }
        })
        return m
    }

    conn.fakeReply = async (jid, text = '', fakeJid = this.user.jid, fakeText = '', fakeGroupJid, options) => {
        return conn.reply(jid, text, {
            key: {
                fromMe: areJidsSameUser(fakeJid, conn.user.id),
                participant: fakeJid,
                ...(fakeGroupJid ? {
                    remoteJid: fakeGroupJid
                } : {})
            },
            message: {
                conversation: fakeText
            },
            ...options
        })
    }

    conn.loadMessage = conn.loadMessage || (async (messageID) => {
        return Object.entries(conn.chats)
            .filter(([_, {
                messages
            }]) => typeof messages === 'object')
            .find(([_, {
                    messages
                }]) => Object.entries(messages)
                .find(([k, v]) => (k === messageID || v.key?.id === messageID)))
            ?.[1].messages?.[messageID]
    })

    conn.downloadM = async (m, type, saveToFile) => {
        if (!m || !(m.url || m.directPath)) return Buffer.alloc(0)
        const stream = await downloadContentFromMessage(m, type)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        if (saveToFile) var {
            filename
        } = await conn.getFile(buffer, true)
        return saveToFile && fs.existsSync(filename) ? filename : buffer
    }

    conn.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        let type = await FileType.fromBuffer(buffer)
        trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
    }

    conn.parseMention = (text = '') => {
        return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
    }

    conn.chatRead = async (jid, participant = conn.user.jid, messageID) => {
        return await conn.sendReadReceipt(jid, participant, [messageID])
    }

    conn.parseMention = (text = '') => {
        return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
    }

    conn.getName = (jid = '', withoutContact = false) => {
        jid = conn.decodeJid(jid)
        withoutContact = this.withoutContact || withoutContact
        let v
        if (jid.endsWith('@g.us')) return new Promise(async (resolve) => {
            v = conn.chats[jid] || {}
            if (!(v.name || v.subject)) v = await conn.groupMetadata(jid) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = jid === '0@s.whatsapp.net' ? {
                jid,
                vname: 'WhatsApp'
            } : areJidsSameUser(jid, conn.user.id) ?
            conn.user :
            (conn.chats[jid] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.vname || v.notify || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    conn.processMessageStubType = async (m) => {
        if (!m.messageStubType) return
        const chat = conn.decodeJid(m.key.remoteJid || m.message?.senderKeyDistributionMessage?.groupId || '')
        if (!chat || chat === 'status@broadcast') return
        const emitGroupUpdate = (update) => {
            conn.ev.emit('groups.update', [{
                id: chat,
                ...update
            }])
        }
        switch (m.messageStubType) {
            case WAMessageStubType.REVOKE:
            case WAMessageStubType.GROUP_CHANGE_INVITE_LINK:
                emitGroupUpdate({
                    revoke: m.messageStubParameters[0]
                })
                break
            case WAMessageStubType.GROUP_CHANGE_ICON:
                emitGroupUpdate({
                    icon: m.messageStubParameters[0]
                })
                break
            default: {
                console.log({
                    messageStubType: m.messageStubType,
                    messageStubParameters: m.messageStubParameters,
                    type: WAMessageStubType[m.messageStubType]
                })
                break
            }
        }
        const isGroup = chat.endsWith('@g.us')
        if (!isGroup) return
        let chats = conn.chats[chat]
        if (!chats) chats = conn.chats[chat] = {
            id: chat
        }
        chats.isChats = true
        const metadata = await conn.groupMetadata(chat).catch(_ => null)
        if (!metadata) return
        chats.subject = metadata.subject
        chats.metadata = metadata
    }

    conn.insertAllGroup = async () => {
        const groups = await conn.groupFetchAllParticipating().catch(_ => null) || {}
        for (const group in groups) conn.chats[group] = {
            ...(conn.chats[group] || {}),
            id: group,
            subject: groups[group].subject,
            isChats: true,
            metadata: groups[group]
        }
        return conn.chats
    }
    conn.pushMessage = async (m) => {
        if (!m) return
        if (!Array.isArray(m)) m = [m]
        for (const message of m) {
            try {
                if (!message) continue
                if (message.messageStubType && message.messageStubType != WAMessageStubType.CIPHERTEXT) conn.processMessageStubType(message).catch(console.error)
                const _mtype = Object.keys(message.message || {})
                const mtype = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(_mtype[0]) && _mtype[0]) ||
                    (_mtype.length >= 3 && _mtype[1] !== 'messageContextInfo' && _mtype[1]) ||
                    _mtype[_mtype.length - 1]
                const chat = conn.decodeJid(message.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || '')
                if (message.message?.[mtype]?.contextInfo?.quotedMessage) {
                    let context = message.message[mtype].contextInfo
                    let participant = conn.decodeJid(context.participant)
                    const remoteJid = conn.decodeJid(context.remoteJid || participant)
                    let quoted = message.message[mtype].contextInfo.quotedMessage
                    if ((remoteJid && remoteJid !== 'status@broadcast') && quoted) {
                        let qMtype = Object.keys(quoted)[0]
                        if (qMtype == 'conversation') {
                            quoted.extendedTextMessage = {
                                text: quoted[qMtype]
                            }
                            delete quoted.conversation
                            qMtype = 'extendedTextMessage'
                        }

                        if (!quoted[qMtype].contextInfo) quoted[qMtype].contextInfo = {}
                        quoted[qMtype].contextInfo.mentionedJid = context.mentionedJid || quoted[qMtype].contextInfo.mentionedJid || []
                        const isGroup = remoteJid.endsWith('g.us')
                        if (isGroup && !participant) participant = remoteJid
                        const qM = {
                            key: {
                                remoteJid,
                                fromMe: areJidsSameUser(conn.user.jid, remoteJid),
                                id: context.stanzaId,
                                participant,
                            },
                            message: JSON.parse(JSON.stringify(quoted)),
                            ...(isGroup ? {
                                participant
                            } : {})
                        }
                        let qChats = conn.chats[participant]
                        if (!qChats) qChats = conn.chats[participant] = {
                            id: participant,
                            isChats: !isGroup
                        }
                        if (!qChats.messages) qChats.messages = {}
                        if (!qChats.messages[context.stanzaId] && !qM.key.fromMe) qChats.messages[context.stanzaId] = qM
                        let qChatsMessages
                        if ((qChatsMessages = Object.entries(qChats.messages)).length > 40) qChats.messages = Object.fromEntries(qChatsMessages.slice(30, qChatsMessages.length)) // maybe avoid memory leak
                    }
                }
                if (!chat || chat === 'status@broadcast') continue
                const isGroup = chat.endsWith('@g.us')
                let chats = conn.chats[chat]
                if (!chats) {
                    if (isGroup) await conn.insertAllGroup().catch(console.error)
                    chats = conn.chats[chat] = {
                        id: chat,
                        isChats: true,
                        ...(conn.chats[chat] || {})
                    }
                }
                let metadata, sender
                if (isGroup) {
                    if (!chats.subject || !chats.metadata) {
                        metadata = await conn.groupMetadata(chat).catch(_ => ({})) || {}
                        if (!chats.subject) chats.subject = metadata.subject || ''
                        if (!chats.metadata) chats.metadata = metadata
                    }
                    sender = conn.decodeJid(message.key?.fromMe && conn.user.id || message.participant || message.key?.participant || chat || '')
                    if (sender !== chat) {
                        let chats = conn.chats[sender]
                        if (!chats) chats = conn.chats[sender] = {
                            id: sender
                        }
                        if (!chats.name) chats.name = message.pushName || chats.name || ''
                    }
                } else if (!chats.name) chats.name = message.pushName || chats.name || ''
                if (['senderKeyDistributionMessage', 'messageContextInfo'].includes(mtype)) continue
                chats.isChats = true
                if (!chats.messages) chats.messages = {}
                const fromMe = message.key.fromMe || areJidsSameUser(sender || chat, conn.user.id)
                if (!['protocolMessage'].includes(mtype) && fromMe && message.messageStubType != WAMessageStubType.CIPHERTEXT && message.message) {
                    delete message.message.messageContextInfo
                    delete message.message.senderKeyDistributionMessage
                    chats.messages[message.key.id] = JSON.parse(JSON.stringify(message, null, 2))
                    let chatsMessages
                    if ((chatsMessages = Object.entries(chats.messages)).length > 40) chats.messages = Object.fromEntries(chatsMessages.slice(30, chatsMessages.length))
                }
            } catch (e) {
                console.error(e)
            }
        }
    }

    conn.format = (...args) => {
        return util.format(...args)
    }

    conn.getBuffer = async (url, options) => {
        try {
            options ? options : {}
            const res = await axios({
                method: "get",
                url,
                headers: {
                    'DNT': 1,
                    'Upgrade-Insecure-Request': 1
                },
                ...options,
                responseType: 'arraybuffer'
            })
            return res.data
        } catch (e) {
            console.log(`Error : ${e}`)
        }
    }

    /*conn.serializeM = (m) => {
        return require("./serializeV2")(conn, m);
    }; */

    Object.defineProperty(conn, 'name', {
        value: 'WASocket',
        configurable: true,
    })
    return conn
}