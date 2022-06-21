const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const {search} = require("../config/database")
const sprintf = require("sprintf-js").sprintf
require("dotenv").config()

module.exports = {
    commandName: "project",
    description: "Fetch the link of a project",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addStringOption(option =>
                option.setName("project_name")
                    .setDescription("Choose a project from the list or create a new one")
                    .setRequired(true)
                    .setAutocomplete(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const projectName = interaction.options.getString("project_name");
        await interaction.reply({
            content: `Project Name: ${projectName}`
        })
        let link;
        if (await search(projectName)){
            link = sprintf(process.env.SOIL_CURRENT_PROJECT_LINK, projectName)
            return interaction.followUp({
                embeds: [
                    new MessageEmbed()
                        .setTitle(`Configure your project ${projectName}`)
                        .setDescription(`Click [here](${link}) to check your projects.`)
                ]
            })
        }else{
            link = process.env.SOIL_NEW_PROJECT_LINK;
            return interaction.followUp({
                embeds: [
                    new MessageEmbed()
                        .setTitle(`Create your new project ${projectName}`)
                        .setDescription(`Click [here](${link}) to create your projects.`)
                ]
            })
        }
    }

}