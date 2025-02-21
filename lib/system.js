/**
* Script by Damaa
* wa.me/6285732245264
* Jangan perjual belikan Script ini tanpa seizin Developer !!
**/

const util = require("util");
const moment = require("moment-timezone");
const fs = require("fs");
const chalk = require("chalk");
const settings = global.db.data.settings;

module.exports = async (m, conn = {}) => {
    try {

        /** Detected Pin Messages **/
        if (m.message?.pinInChatMessage) {
            if (settings.self) return
            conn.sendMessage(m.chat, {
                text: `@${m.sender.split('@')[0]} ${m.msg.type === 1 ? 'pinned' : 'unpinned'} messages`,
                mentions: [m.sender]
            })
        }

    } catch (e) {
        if (/overlimit|time|out/.test(e.message)) return
        console.log(e)
    }

};
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    delete require.cache[file];
    if (global.reloadHandler) console.log(global.reloadHandler());
});