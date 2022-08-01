const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { sprintf } = require('sprintf-js');
const CONSTANT = require("../helper/const");
const { validProject } = require('../helper/util');

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
                option.setName("project")
                    .setDescription("Choose a project from the list or create a new one")
                    .setRequired(true)
                    .setAutocomplete(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const projectId = interaction.options.getString("project");
        let link;
        const result = validProject(projectId);
        if (result){
            link = sprintf(CONSTANT.LINK.PROJECT_TWEET, result._id)
            return interaction.reply({
                content: `Project Name: \`${result.title}\``,
                embeds: [
                    new MessageEmbed()
                        .setTitle(`Configure your project: ${result.title}`)
                        .setDescription(`Click [here](${link}) to check project's progress.`)
                ],
                ephemeral: true
            })
        }else{
            link = CONSTANT.LINK.NEW_PROJECT
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