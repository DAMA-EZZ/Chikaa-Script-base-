const PhoneNum = require("awesome-phonenumber");
const chalk = require("chalk");
const {
    isJidGroup
} = require("@whiskeysockets/baileys");
const moment = require("moment-timezone");

const Logger = async (m, conn = {}) => {
    if (!m) return;
    const isGroup = isJidGroup(m.chat);
    const pn = new PhoneNum("+" + m.sender.split("©")[0]);
    const countryCode = pn.getCountryCode();
    const country = pn.getRegionCode();
    const regionNames = new Intl.DisplayNames(["id"], {
        type: "region"
    });
    const countryName = regionNames.of(country);
    const mimetype = m.mtype
    let txt = m.text ? (m.text.length >= 30 ? m.text.slice(0, 29) + "..." : m.text) : "";
    const log = chalk.white.bold;
    const headers = ` — ${chalk.yellow.bold(`[ ${countryName} ]`)} ${log("Messages Information :")}`;

    let body = "";
    if (isGroup) {
        body = `${log(`Chats : Group Chat`)}
${log(`Plugins : ${m.plugin ? m.plugin : 'chat message'}`)}
${log(`isBot : ${m.isBaileys}`)}
${log(`Subject : ${await conn.getName(m.chat)}`)}
${log(`Sender Name : ${m.name}`)}
${log(`Time : ${moment.tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm:ss")}`)}
${log(`Mimetype : ${mimetype}`)}`;
    } else {
        body = `${log(`Chats : Private Chat`)}
${log(`Plugins : ${m.plugin ? m.plugin : 'chat message'}`)}
${log(`isBot : ${m.isBaileys}`)}
${log(`Name : ${m.name}`)}
${log(`ID : ${m.id}`)}
${log(`Time : ${moment.tz("Asia/Jakarta").format("DD/MM/YYYY HH:mm:ss")}`)}
${log(`Mimetype : ${mimetype}`)}`;
    }
    console.log(`\n--------------------------------------\n${headers}\n${body}\n--------------------------------------\n${m.isCommand ? chalk.yellow.bold(txt) : txt}`);
};

module.exports = Logger;

let fs = require('fs')
let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright("Update 'lib/print.js'"))
    delete require.cache[file]
})