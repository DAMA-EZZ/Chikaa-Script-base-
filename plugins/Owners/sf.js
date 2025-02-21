/**
* Script by Damaa
* wa.me/6285732245264
* Jangan perjual belikan Script ini tanpa seizin Developer !!
**/

const fs = require('fs')
const syntaxError = require('syntax-error')
const path = require('path')
const util = require('util')
const _fs = fs.promises

let handler = async (m, {
    text,
    usedPrefix,
    command,
    __dirname
}) => {
    let input = `Where is path ?`
    if (!text) return m.reply(input)
    if (!m.quoted) throw `Reply code`

    if (/p(lugin)?/i.test(command)) {
        let filename = text.replace(/plugin(s)\//i, '') + (/\.js$/i.test(text) ? '' : '.js')
        const error = syntaxError(m.quoted.text, filename, {
            ...(filename.endsWith('.mjs') ? {
                sourceType: 'module',
                allowReturnOutsideFunction: true,
                allowAwaitOutsideFunction: true,
                allowImportExportEverywhere: true
            } : {})
        })
        if (error) throw error
        const pathFile = path.join(__dirname, filename)
        await _fs.writeFile(pathFile, `/**
* Script by Damaa
* wa.me/6285732245264
* Jangan perjual belikan Script ini tanpa seizin Developer !!
**/\n\n` + m.quoted.text)
        m.reply(`
Successfully saved to *${filename}*
`.trim())
    } else {
        const isJavascript = m.quoted.text && !m.quoted.mediaMessage && /\.js/.test(text)
        if (isJavascript) {
            const error = syntaxError(m.quoted.text, text, {
                sourceType: 'module',
                allowReturnOutsideFunction: true,
                allowAwaitOutsideFunction: true,
                allowImportExportEverywhere: true
            })
            if (error) throw error
            await _fs.writeFile(text, `/**
* Script by Damaa
* wa.me/6285732245264
* Jangan perjual belikan Script ini tanpa seizin Developer !!
**/\n\n` + m.quoted.text)
            m.reply(`
Successfully saved to *${text}*
`.trim())
        } else if (m.quoted.isMedia) {
            const media = await m.quoted.download()
            await _fs.writeFile(text, media)
            m.reply(`
Successfully saved media to *${text}*
`.trim())
        } else {
            throw 'Not supported!!'
        }
    }
}
handler.help = handler.command = ['sf']
handler.tags = ['owner']
handler.rowner = true

module.exports = handler