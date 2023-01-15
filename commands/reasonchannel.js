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
		.setName('registerreasonchannel')
		.setDescription('Shows how the user found out about the server.'),
	async execute(interaction) {
		//updates so the selected channel is where the reasons for joining will appear.
		if (!servers[interaction.guild.id]){
			servers[interaction.guild.id]={}
		}
		servers[interaction.guild.id].reason_channel=interaction.channel.id
		interaction.reply({content: "Successfully selected reason channel.", ephemeral:true})
		fs.writeFile("servers.json", JSON.stringify({"servers": servers}), "utf8", (e)=>{console.error(e)})
	},
	
};