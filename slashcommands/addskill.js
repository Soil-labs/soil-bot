const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");
const {awaitWrap} = require("../helper/util")
const sprintf = require("sprintf-js").sprintf
require("dotenv").config()

module.exports = {
    commandName: "skill",
    description: "Skill someone",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addUserOption(option =>
                option.setName("user")
                    .setDescription("The member you'd like to support")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("skill")
                    .setDescription("Choose a project from the list or create a new one")
                    .setRequired(true)
                    .setAutocomplete(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const skill = interaction.options.getString('skill')
        if (user.bot) return interaction.reply({
            content: "Sorry, you cannot choose a bot as a target."
        })
        const DMchannel = await user.createDM();
        const {result ,error} = await awaitWrap(DMchannel.send({
            content: `${interaction.member.displayName} skilled you with ${skill}`
        }));
        if (error) return interaction.reply({
            content: `<@${user.id}>: I cannot DM you.\n${interaction.member.displayName} just skilled you with ${skill}!`
        })
        else return interaction.reply({
            content: 'DM is sent.'
        })
    }

}