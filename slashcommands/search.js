const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const myCache = require('../helper/cache');
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
        const project = interaction.options.getString("project_name");

        if (userId && project) return interaction.reply({
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

        if (project){
            return interaction.reply({
                content: `Here is the project ${project} information.`
            })
        }
    }

}