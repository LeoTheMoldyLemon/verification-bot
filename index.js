const discord = require('discord.js');
const { join } = require('path');
const { token, role_id } = require('./config.json');
const client = new discord.Client({ intents: 65323 });
const {servers} = require("./servers.json")
const fs = require("fs");
const {ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Events,
  GatewayIntentBits,
  InteractionType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Collection,
  AttachmentBuilder, 
  StringSelectMenuBuilder,
  EmbedBuilder  } = require('discord.js')

//loads in commnads from the folder ./commands/
client.commands = new Collection();
for (const file of fs.readdirSync("./commands").filter(file => file.endsWith('.js'))) {
	const command = require("./commands/"+file);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${file} is missing a required "data" or "execute" property.`);
	}
}




//logging and error handling
client.on('ready', () => {
	console.log('Ready!');
});

client.on('error', e => {
    console.log('The WebSocket encountered an error:', e);
});


//command event processing
client.on(Events.InteractionCreate, async interaction =>{
	
	//commands for registering channels and such
	if (interaction.isChatInputCommand()){
		if (!interaction.member.hasPermission("ADMINISTRATOR")) {
			interaction.reply({ content: `/ commands for this bot are admin only!`, ephemeral: true });
		};
		const command = interaction.client.commands.get(interaction.commandName);
		console.log(`[${interaction.guild.name}] ${interaction.user.username}: ${command.data.name}`)
		if (!command) {
			interaction.reply({content:`${command} is not a command.`, ephemeral:true})
			return;
		}
		try {
			await command.execute(interaction);
		} catch (e) {
			console.error(e);
			await interaction.reply({ content: `There was an error while executing this command!`, ephemeral: true });
		}
	}
	else if(interaction.isButton()){
		console.log(`[${interaction.guild.name}] ${interaction.user.username}: pressed ${interaction.customId}`)
		
		//button that shows the form for entering the captcha answer
		if(interaction.customId === "answer_btn"){
			console.log(`[${interaction.guild.name}] ${interaction.user.username}: answer button pressed, sending modal`)
			let modal= new ModalBuilder()
				.setCustomId("answer_mod")
				.setTitle("Verify that you are human.")
				.addComponents([
					new ActionRowBuilder().addComponents(
						new TextInputBuilder()
							.setCustomId('answer_textin')
							.setLabel('Enter the text you saw in the image.')
							.setStyle(TextInputStyle.Short)
							.setMinLength(6)
							.setMaxLength(20)
							.setPlaceholder('Answer')
							.setRequired(true)
					)
				])
			await interaction.showModal(modal);
		}
		//button that generates the image and the answer button
		if(interaction.customId === "verify_btn"){
			console.log(`[${interaction.guild.name}] ${interaction.user.username}: verify pressed, sending captcha image`)
			let files=fs.readdirSync("./Captcha_Images").filter(file => file.endsWith('.png'))
			let captcha_name = files[Math.floor(Math.random()*files.length)];
			let captcha_image = new AttachmentBuilder(`./Captcha_Images/${captcha_name}`);
			let embed = new EmbedBuilder()
				.setTitle('Memorize the text in the following image then press the answer button.')
				.setImage(`attachment://${captcha_name}`);
			let btn = new ActionRowBuilder();

			btn.addComponents(
				new ButtonBuilder()
					.setCustomId('answer_btn')
					.setStyle(ButtonStyle.Primary)
					.setLabel('Answer'),
			);
			interaction.member.captcha_code=captcha_name.replace(".png", "")
			console.log(`[${interaction.guild.name}] ${interaction.user.username}: selected captcha: ${interaction.member.captcha_code}`)
			if (interaction.member.verify_msg){
				interaction.member.verify_msg.deleteReply()
			}
			interaction.member.verify_msg= interaction
			await interaction.reply({components: [btn], embeds: [embed], files: [captcha_image], ephemeral: true})
			
			console.log(interaction.member.verify_msg.id)
			/*let filter = i => i.customId === 'answer_btn';
			let collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
			collector.on('collect', async i => {
				await i.deleteReply();
			});*/
		}
	}
	else if (interaction.type === InteractionType.ModalSubmit) {
		//checking the submitted form answer for this user and prompting the reason menu
		
		console.log(`[${interaction.guild.name}] ${interaction.user.username}: received captcha code, verifing...`)
		if (interaction.customId === 'answer_mod') {
			let res = interaction.fields.getTextInputValue('answer_textin').replaceAll(" ", "");
			if (res==interaction.member.captcha_code){
				console.log(`[${interaction.guild.name}] ${interaction.user.username}: correct captcha code (${res})`)
				let row1 = new ActionRowBuilder()
					.addComponents(
						new StringSelectMenuBuilder()
							.setCustomId('reason_sel')
							.setPlaceholder('Nothing selected')
							.addOptions(
								{
									label: 'A friend',
									description: 'A friend told my about this server.',
									value: 'Heard of the server through a friend.',
								},
								{
									label: 'Social media',
									description: 'I saw the server on social media.',
									value: 'Heard of the server on social media.',
								},
								{
									label: 'Search engine',
									description: 'I found the server via search engine.',
									value: 'Found the server via search engine.',
								},
								{
									label: 'Other',
									description: 'Found the server some other way.',
									value: 'Other',
								},
							),
							
						);
				

				interaction.reply({components: [row1], content:`Succesfully verified! Before you continue, please answer these two questions (After this you will be given access to ${interaction.guild.name}.): How did you find out about ${interaction.guild.name}?`, ephemeral: true });
				
			}else{
				console.log(`[${interaction.guild.name}] ${interaction.user.username}: incorrect captcha code (${res}, ${interaction.member.captcha_code})`)
				interaction.reply({ content: `Incorrect verification code, please try again. (Press the "Verify" button in the above message.)`, ephemeral: true });
			}
			interaction.member.verify_msg.deleteReply()
			interaction.member.verify_msg=undefined
			
			
		}
	}
	else if (interaction.isStringSelectMenu()){
		//when the user selects the reason, it is sent to the reason channel and the user is granted access
		if (interaction.customId === 'reason_sel') {
			let row2 = new ActionRowBuilder()
				.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('takeaway_sel')
						.setPlaceholder('Nothing selected')
						.addOptions(
							{
								label: 'Certification',
								description: 'I want to become certified.',
								value: 'To become certified.',
							},
							{
								label: 'Education',
								description: 'I want to learn more about a specific area.',
								value: 'To learn.',
							},
							{
								label: 'Resources',
								description: 'I want ot see what resources are available.',
								value: 'To see what resources are available.',
							},
							{
								label: 'Community',
								description: 'I want to find a community of similar interests.',
								value: 'To find a comunity of similar interests.',
							},
							{
								label: 'Other',
								description: 'I am just taking a look around. ',
								value: 'Just taking a look around.',
							},
							
						),
				);
			interaction.update({components: [row2], content:`What do you intend to take away from ${interaction.guild.name}?`, ephemeral: true })
			interaction.member.reason=interaction.values[0]
		}else if (interaction.customId === 'takeaway_sel') {
			interaction.member.guild.roles.fetch(role_id)
				.then(role => {interaction.member.roles.add(role, "User verification successful.")
				.then(interaction.update({ content: `Thank you! You now have access to ${interaction.guild.name}, enjoy!`, components: [], ephemeral: true  }))
				})
			if(servers[interaction.guild.id].reason_channel){
				client.channels.fetch(servers[interaction.guild.id].reason_channel).then(channel=>channel.send({content: `${interaction.user.username} joined. Reason for joining: ${interaction.member.reason} What they want from the server: ${interaction.values[0]}`}))
			}
			console.log(`[${interaction.guild.name}] ${interaction.user.username}: user registered, reason for joining is: ${interaction.values[0]}`)
		}
		
		
		
	};
});


client.on(Events.GuildMemberAdd, async member =>{
	console.log(`[${member.guild.name}] ${member.user.username}: new user joined`)
	if (!(member.guild.id in servers)) return;
	client.channels.fetch(servers[member.guild.id].verify_channel_id).then(channel => channel.send(`<@${member.user.id}>`).then(msg => msg.delete()))
})




client.login(token);
