const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");
const {update} = require("../config/database")
const sprintf = require('sprintf-js').sprintf;

module.exports = {
    commandName: "update",
    description: "Report your project news.",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addStringOption(option =>
                option.setName("project_name")
                    .setDescription("Choose a project from the list")
                    .setRequired(true)
                    .setAutocomplete(true))
            .addUserOption(option =>
                option.setName("update_user")
                    .setDescription("The user who updates this project")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("update_news")
                    .setDescription("News or announcement you'd like to report")
                    .setRequired(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const updateProjectName = interaction.options.getString("project_name");
        const user = interaction.options.getUser("update_user");
        const updateNews = interaction.options.getString("update_news");

        await interaction.reply({
            content: sprintf("Updated project: %s\n Users invovled: %s\nUpdateNews: %s"
                , updateProjectName, user.username, updateNews)
        })
        if (await update(updateProjectName, user.id, updateNews)){
            return interaction.followUp({
                content: `Congrates, you just submitted an update on project.`
            })
        }else{
            return interaction.followUp({
                content: `Sorry, your update is invalid, please try again later.`
            })
        }
    }

}