const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { validUser } = require('../helper/util');
const { endorseAttribute } = require('../helper/graphql');
const { sprintf } = require('sprintf-js');
const CONSTANT = require("../helper/const");
const myCache = require('../helper/cache');


module.exports = {
    commandName: "personality",
    description: "Endorse a specific  personality trait of someone",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addUserOption(option =>
                option.setName("person")
                    .setDescription("The member you'd like to endorse")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("trait")
                    .setDescription("Choose one of traits from the list")
                    .setChoices(
                        { name: "Director", value: "Director" },
                        { name: "Motivator", value: "Motivator" },
                        { name: "Inspirer", value: "Inspirer" },
                        { name: "Helper", value: "Helper" },
                        { name: "Supporter", value: "Supporter" },
                        { name: "Coordinator", value: "Coordinator" },
                        { name: "Observer", value: "Observer" },
                        { name: "Reformer", value: "Reformer" },
                    )
                    .setRequired(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const user = interaction.options.getUser("person");
        const trait = interaction.options.getString("trait");

        if (user.id == interaction.user.id) return interaction.reply({
            content: "Sorry, you cannot endorse yourself with a trait.",
            ephemeral: true
        })
        const validResult = validUser(user.id);
        if (!validResult) return interaction.reply({
            content: "Sorry, please use \`/onboard\` command to join in Soil🌱 first",
            ephemeral: true
        })

        await interaction.deferReply({ ephemeral: true });

        const [result, error] = await endorseAttribute({
            memberId: user.id,
            attribute: trait
        });

        if (error) return interaction.followUp({
            content: `Error occured when uploading your endorsement: \`${error}\``
        });

        return interaction.followUp({
            content: sprintf(CONSTANT.CONTENT.ENDORSE_ATTRIBUTE, {
                endorseeName: validResult.discordName,
                attributeName: trait
            })
        })

    }

}