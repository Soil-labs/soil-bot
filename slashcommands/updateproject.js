const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const {update} = require("../config/database")
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
                option.setName("user_name")
                    .setDescription("Select users")
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
        const updateProjectName = interaction.options.getString("project_name");
        const userString = interaction.options.getString("user_name");
        const updateNews = interaction.options.getString("update_news");
        const userArray = userString.match(/[0-9]{18}/g);
        if (!userArray){
            return interaction.reply({
                content: "You don't mention any user in this command."
            })
        }
        const userNameArray = userArray.map(userId => interaction.guild.members.cache.get(userId).displayName);
        if (await update(updateProjectName, userNameArray, updateNews)){
            return interaction.reply({
                content: `User you added: ${userNameArray.toString()}`,
                embeds: [
                    new MessageEmbed()
                        .setTitle(`Congrates, you just submitted an update on project.`)
                ]
            })
        }else{
            return interaction.reply({
                content: `User you added: ${userNameArray.toString()}`,
                embeds: [
                    new MessageEmbed()
                        .setTitle(`Sorry, your update is invalid, please try again later.`)
                ]
            })
        }
    }

}