const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const CONSTANT = require("../helper/const");

module.exports = {
    commandName: "champion",
    description: "Manage your project",

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
            .setTitle("Champion Dashboard 🏆")
            .setDescription(`Manage your projects [here](${CONSTANT.LINK.DASHBOARD})`);
        return interaction.reply({
            embeds: [
                replyEmbed
            ],
            ephemeral: true
        })
    }
}