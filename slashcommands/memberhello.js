const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");

module.exports = {
    commandName: "hello_member",
    description: "Say hello to you!",
   
	data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
    },

	/**
	 * @param  {CommandInteraction} interaction
	 */
	async execute(interaction) {
        return interaction.reply({
            content: `Hello! ${interaction.member.displayName}`
        })
	}

}