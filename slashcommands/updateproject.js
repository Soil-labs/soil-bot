const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const {update} = require("../config/database");
const { newTweetProject } = require('../helper/graphql');
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
            .addStringOption(option =>
                option.setName("user")
                    .setDescription("Select users")
                    .setAutocomplete(true)
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
        const updateProjectId = interaction.options.getString("project_name");
        const userId = interaction.options.getString("user");
        const updateNews = interaction.options.getString("update_news");
        await interaction.deferReply({
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