/**
* Script by Damaa
* wa.me/6285732245264
* Jangan perjual belikan Script ini tanpa seizin Developer !!
**/

const fs = require("fs");
module.exports = {
    help: ["getplugins"],
    tags: ["owner"],
    command: ["gp", "getplugins"],
    run: async (
        m, {
            conn,
            args,
            usedPrefix,
            command,
            text,
            isOwner,
            isAdmin,
            isBotAdmin,
            isPrems,
            chatUpdate,
        },
    ) => {
        try {
            let array = Object.keys(plugins);
            if (!args[0]) return m.reply(`${array.map(item => item.split("/").pop().replace(".js", "")).map((item, i) => `${i + 1}. ${item}`).join("\n")}`);
            await m.reply(wait)
            let index = array.findIndex(item => item.includes(args[0]));
            if (-1 !== index) {
                let plugin = array[index];
                m.reply(fs.readFileSync(process.cwd() + plugin).toString());
            } else if (!isNaN(text)) {
                let ListPlugins = Object.keys(plugins).map((a) => a.split("/plugins/")[1]);
                if (!fs.existsSync(process.cwd() + "/plugins/" + ListPlugins[text - 1])) return m.reply(`${array.map(item => item.split("/").pop().replace(".js", "")).map((item, i) => `${i + 1}. ${item}`).join("\n")}`);
                m.reply(fs.readFileSync(process.cwd() + "/plugins/" + ListPlugins[text - 1]).toString());
            } else {
                return m.reply(`${array.map(item => item.split("/").pop().replace(".js", "")).map((item, i) => `${i + 1}. ${item}`).join("\n")}`);
            }
        } catch (e) {
            throw e
        }
    },
    owner: true,
};
