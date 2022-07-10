const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const CONSTANT = require("../helper/const");
const { validProject } = require('../helper/util');
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
        const projectId = interaction.options.getString("project_name");
        let link;
        const result = validProject(projectId);
        if (result){
            link = CONSTANT.URL.NEW_PROJECT
            return interaction.reply({
                content: `Project Name: \`${result.tagName}\``,
                embeds: [
                    new MessageEmbed()
                        .setTitle(`Configure your project: ${result.tagName}`)
                        .setDescription(`Click [here](${link}) to configure your projects.`)
                ],
                ephemeral: true
            })
        }else{
            link = CONSTANT.URL.NEW_PROJECT
            return interaction.reply({
                content: `Project Name: ${projectId}`,
                embeds: [
                    new MessageEmbed()
                        .setTitle(`Create your new project: \`${projectId}\``)
                        .setDescription(`Click [here](${link}) to create your projects.`)
                ],
                ephemeral: true
            })
        }
    }

}