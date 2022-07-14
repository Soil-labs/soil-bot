const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");
const { validUser } = require('../helper/util');
const { sprintf } = require('sprintf-js');
const CONSTANT = require("../helper/const");
require("dotenv").config()

module.exports = {
    commandName: "onboard",
    description: "Onboard yourself",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const userId = interaction.user.id;
        const searchResult = validUser(userId);
        if (searchResult) return interaction.reply({
            content: "Sorry, you have onboarded before.",
            ephemeral: true
        })
        const onboardLink = sprintf(CONSTANT.LINK.ONBOARD, userId)
        return interaction.reply({
            content: sprintf("Say hi 👋 to your magic ✨, AI-driven bot that helps you find & be found 🔎  for opportunities to collaborate, learn & earn across the DAO.\n\nIn order for the perfect project to find you ❤️ - we've made a quick & easy onboarding flow.\n\nClick 👇\n\n🔗Link to [onboarding flow](%s).", onboardLink),
            ephemeral: true
        })
    }

}