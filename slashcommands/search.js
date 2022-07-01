const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");
require("dotenv").config()

module.exports = {
    commandName: "search",
    description: "Search a user or a project",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addUserOption(option =>
                option.setName("user")
                    .setDescription("The member you'd like to support"))
            .addStringOption(option =>
                option.setName("project_name")
                    .setDescription("Choose a project from the list")
                    .setAutocomplete(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        if (interaction.options._hoistedOptions.length == 0) {
            return interaction.reply({
                content: "Please choose at least one option.",
            })
        }

        const user = interaction.options.getUser("user");
        const project = interaction.options.getString("project_name");
        if (user.bot) return interaction.reply({
            content: "Sorry, you cannot choose a bot as a target."
        })
        if (user && project){
            return interaction.reply({
                content: `Here is the user ${user.username} profile.\nHere is the project ${project} information.`
            })
        }

        if (user){
            return interaction.reply({
                content: `Here is the user ${user.username} profile.`
            })
        }

        if (project){
            return interaction.reply({
                content: `Here is the project ${project} information.`
            })
        }
    }

}