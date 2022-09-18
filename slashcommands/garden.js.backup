const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");

const CONSTANT = require("../helper/const");


module.exports = {
    commandName: "garden",
    description: "Guild Garden",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addSubcommand(command =>
                command.setName("feed")
                    .setDescription("Check the feed of our garden."))
            .addSubcommand(command =>
                command.setName("graph")
                    .setDescription("Check the graph of our garden."))
            
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();
        if (subCommand == "feed"){
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle("Garden Feed")
                        .setDescription(`Click here to check [feed](${CONSTANT.LINK.GARDEN_FEED})`)
                ],
                ephemeral: true
            })
        }

        if (subCommand == "graph"){
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle("Garden Graph")
                        .setDescription(`Click here to check [feed](${CONSTANT.LINK.GARDEN_GRAPH})`)
                ],
                ephemeral: true
            })
        }
        
    }

}