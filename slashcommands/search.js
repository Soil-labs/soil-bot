const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { fetchProjectDetail } = require('../helper/graphql');
const myCache = require('../helper/cache');
const sprintf = require('sprintf-js').sprintf;
require("dotenv").config()

module.exports = {
    commandName: "search",
    description: "Search a user or a project",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addStringOption(option =>
                option.setName("user")
                    .setDescription("Choose a user from the list")
                    .setAutocomplete(true))
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

        const userId = interaction.options.getString("user");
        const projectId = interaction.options.getString("project_name");

        if (userId && projectId) return interaction.reply({
            content: "Please choose one option in this command.",
            ephemeral: true
        })

        if (userId){
            const searchResult = myCache.get("users").filter(value => value._id == userId);
            if (searchResult.length == 0) return interaction.reply({
                content: "Sorry, we cannot find information of this userr.",
                ephemeral: true
            })
            const member = searchResult[0];
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                    .setTitle(`${member?.discordName ?? "Unknown"} Profile`)
                    .setThumbnail(member?.discordAvatar)
                ]
            })
            
        }

        if (projectId){
            await interaction.deferReply({
                ephemeral: true
            });
            const [result, error] = await fetchProjectDetail({projectID: projectId});
            if (error) return interaction.followUp({
                content: `Error occured: \`${error.response.errors[0].message}\``
            })
            const projectEmbed = new MessageEmbed()
                .setAuthor({name: result?.tagName ?? "No tagName"})
                .setTitle(sprintf("Title: %s", result?.title ?? "No title"))
                .setDescription(sprintf("Description: %s", result?.description ?? "No description"));
            let tweets = [];
            result.tweets.forEach((value) => {
                tweets.push(
                    {
                        name: "Content",
                        value: value?.content ?? "No content",
                        inline: true
                    },
                    {
                        name: "Author",
                        value: value?.author?.discordName ?? "No author name",
                        inline: true
                    },
                    {
                        name: "Time",
                        value: `<t:${Math.floor(parseInt(value.registeredAt)/1000)}>`,
                        inline: true
                    }
                )
            })
            return interaction.followUp({
                content: `Here is the project ${result?.tagName ?? "No tagName"} information.`,
                embeds: [projectEmbed.addFields(tweets)]
            })
        }
    }

}