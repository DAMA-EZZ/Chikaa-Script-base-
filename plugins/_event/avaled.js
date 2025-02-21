/*Simple WhatsApp bot
 * Credits : Bang_syaii
 * RestAPI : https://api.botwa.space
 * Community : https://api.botwa.space/s/gcbot
 */

const util = require("util");
const {
    exec
} = require("child_process");

module.exports = {
    events: async (m, {
        conn,
        isOwner,
        Func,
        Scraper,
        body,
        match
    }) => {
        if (m.text.startsWith("=>")) {
            if (!isOwner) return;
            try {
                const result = await eval(
                    `(async () => { return ${m.text.slice(3)} })()`,
                );
                conn.reply(m.chat, util.format(result), m);
            } catch (e) {
                conn.reply(m.chat, util.format(e), m);
            }
        } else if (m.text.startsWith(">")) {
            if (!isOwner) return;
            try {
                const result = await eval(`(async() => { ${m.text.slice(2)} })()`);
                conn.reply(m.chat, util.format(result), m);
            } catch (e) {
                conn.reply(m.chat, util.format(e), m);
            }
        } else if (m.text.startsWith("$")) {
            if (!isOwner) return;
            conn.sendMessage(m.chat, {
                react: { 
                    text: '🕒', 
                    key: m.key 
                }
            });
            exec(m.text.slice(2), async (err, stdout) => {
                if (err)
                    return await conn.sendMessage(m.chat, {
                        text: util.format(err),
                    });
                if (stdout)
                    return await conn.sendMessage(m.chat, {
                        text: util.format(stdout),
                    });
            });
        } else return;
    },
};
