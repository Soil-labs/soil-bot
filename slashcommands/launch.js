const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { validUser } = require('../helper/util');
const { addNewMember, updateUser } = require('../helper/graphql');
const { sprintf } = require('sprintf-js');
const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");
const _ = require("lodash");


module.exports = {
    commandName: "launch",
    description: "Create a project.",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addStringOption(option =>
                option.setName("project_name")
                    .setDescription("Your project name.")
                    .setRequired(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        return interaction.reply({
            embeds: [
                new MessageEmbed()
                    .setTitle(`Create a new project ${interaction.options.getString("project_name")}`)
                    .setDescription(sprintf("Use this [link](%s) to create your project.", "https://www.figma.com/proto/kilODLeVBrX7xyAzMBlXXy/soil-%F0%9F%8C%B1?page-id=2074%3A1449&node-id=2211%3A3614&viewport=-5542%2C9%2C0.27&scaling=scale-down&starting-point-node-id=2211%3A3614"))
            ],
            ephemeral: true
        })
    }

}