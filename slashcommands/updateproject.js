const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");
const { newTweetProject } = require('../helper/graphql');
const { validUser } = require('../helper/util');

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
            .addStringOption(option =>
                option.setName("update_news")
                    .setDescription("News or announcement you'd like to report")
                    .setRequired(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const updateProjectId = interaction.options.getString("project_name");
        const userId = interaction.user.id;
        const updateNews = interaction.options.getString("update_news");
        await interaction.deferReply({
            ephemeral: true
        })
        if (!validUser(userId)) return interaction.reply({
            content: "Sorry, you don't have access to update this project.",
            ephemeral: true
        })
        const [result, error] = await newTweetProject({
            projectID: updateProjectId,
            content: updateNews,
            author: userId
        });
        if (error) return interaction.followUp({
            content: `Error occured: \`${error.response.errors[0].message}\``
        })

        return interaction.followUp({
            content: "Updated"
        })
    }

}