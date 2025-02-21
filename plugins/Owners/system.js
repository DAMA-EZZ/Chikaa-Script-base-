/**
* Script by Damaa
* wa.me/6285732245264
* Jangan perjual belikan Script ini tanpa seizin Developer !!
**/

module.exports = {
   help: ['self', 'debug', 'grouponly', 'levelup'],
   tags: ['owner'],
   command: ['self', 'debug', 'grouponly', 'levelup'],
   use: 'on/off',
   owner: true,
   async run (m, {
      conn,
      args,
      usedPrefix,
      command,
      Func
   }) {
      let system = global.db.data.settings;
      let type = command.toLowerCase()
      if (!args || !args[0]) return m.reply(`*Current status* : [ ${system[type] ? 'ON' : 'OFF'} ]`);
      let option = args[0].toLowerCase();
      let optionList = ['on', 'off'];
      if (!optionList.includes(option)) return m.reply(`*Current status* : [ ${system[type] ? 'ON' : 'OFF'} ]`);
      let status = option != 'on' ? false : true
      if (system[type] == status) return m.reply(`${Func.ucword(command)} has been ${option == 'on' ? 'activated' : 'inactivated'} previously.`);
      system[type] = status
      m.reply(`${Func.ucword(command)} has been ${option == 'on' ? 'activated' : 'inactivated'} successfully.`)
   },
}