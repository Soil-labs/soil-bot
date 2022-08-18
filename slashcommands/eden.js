const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const CONSTANT = require("../helper/const");

module.exports = {
    commandName: "eden",
    description: "Introduce Eden Protocol",

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
        const replyEmbed = new MessageEmbed()
            .setTitle("Eden 🌳 project/person match commands")
            .setDescription(`Eden helps you find projects you love & great people to do those project with! Find our more thorugh the [link](${CONSTANT.LINK.EDEN_WEBPAGE})`);
        return interaction.reply({
            content: "what is Eden?",
            embeds: [
                replyEmbed
            ],
            ephemeral: true
        })
    }

}