const { REST, Routes } = require('discord.js');
const { clientId, token } = require('./config.json');
const fs = require('node:fs');



const commands = [];
const files = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
//grabbing commands for deployment
for (const file of files) {
	const command = require(`./commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
	try {
		console.log("Starting deployment");
		//using rest api to tell discord about our bot commands
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Deployed ${data.length} commands.`);
	} catch (e) {
		console.error(e);
	}
})();