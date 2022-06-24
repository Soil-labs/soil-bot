const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");
require("dotenv").config()

module.exports = {
    commandName: "onboarding",
    description: "Onboard a newcomer",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addUserOption(option =>
                option.setName("user")
                    .setDescription("The member you'd like to support")
                    .setRequired(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        return interaction.reply({
            content: `<@${user.id}> use this [link](https://www.google.com/) to submit your inform.`
        })
    }

}