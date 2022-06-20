const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");

module.exports = {
    commandName: "hello_channel",
    description: "Send hello to a channel!",
   
	data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addChannelOption(option =>
                option.setName("hello_channel")
                    .setDescription("Choose a channel you like")
                    .setRequired(true))
    },

	/**
	 * @param  {CommandInteraction} interaction
	 */
	async execute(interaction) {
        const targetChannel = interaction.options.getChannel("hello_channel");
        interaction.reply({
            content: `Message has been sent to <#${targetChannel.id}>`
        })
        return targetChannel.send({
            content: "Hello!"
        })
	}

}