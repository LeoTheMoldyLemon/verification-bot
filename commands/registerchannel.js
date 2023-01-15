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
  EmbedBuilder,
  SlashCommandBuilder } = require('discord.js');
const fs = require("fs")
const {servers}=require("../servers.json")

module.exports = {
	data: new SlashCommandBuilder()
		.setName('registerverificationchannel')
		.setDescription('Sets this as the channel in which the veriffication message will appear.'),
	async execute(interaction) {
		//deleteing the old verify message and creating a new one at the designated location
		console.log(`[${interaction.guild.name}] ${interaction.user.username}: saving new verification channel`)
		if (!servers[interaction.guildId]){
			servers[interaction.guildId]={}
			console.log(`[${interaction.guild.name}] ${interaction.user.username}: saving new guild`)
		
		}
		if (servers[interaction.guildId].verify_msg_id && servers[interaction.guildId].verify_channel_id){
			interaction.client.channels.fetch(servers[interaction.guildId].verify_channel_id)
				.then(channel=> channel.messages.fetch(servers[interaction.guildId].verify_msg_id)
				.then(msg=> msg.delete()))
			console.log(`[${interaction.guild.name}] ${interaction.user.username}: old verification message deleted`)
		}
		servers[interaction.guildId].verify_channel_id=interaction.channelId
		
		
		
		let btn = new ActionRowBuilder();
		btn.addComponents(
			new ButtonBuilder()
				.setCustomId('verify_btn')
				.setStyle(ButtonStyle.Primary)
				.setLabel('Verify'),
		);
		interaction.deferReply();
		interaction.deleteReply();
		interaction.channel.send({content: `Please, verify that you are human to gain access to **${interaction.guild.name}**.`, components: [btn]}).then(msg=>{
			servers[interaction.guildId].verify_msg_id= msg.id
			fs.writeFile("servers.json", JSON.stringify({"servers": servers}), "utf8", (e)=>{console.error(e)})
			console.log(`[${interaction.guild.name}] ${interaction.user.username}: registered new verification channel`)
		})
		
	},
	
};