const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");
const myCache = require('../helper/cache');
const { addSkillToMember } = require('../helper/graphql');
const {awaitWrap, validSkill, validUser} = require("../helper/util")
require("dotenv").config()

module.exports = {
    commandName: "skill",
    description: "Skill someone",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addStringOption(option =>
                option.setName("user")
                    .setDescription("The member you'd like to support")
                    .setRequired(true)
                    .setAutocomplete(true))
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
        const user = interaction.options.getString('user');
        const skill = interaction.options.getString('skill')

        console.log(user)
        if (!validUser(user)) return interaction.reply({
            content: "Sorry, user you chose is not valid, please use \`/onboarding\` command to add him/her first.",
            ephemeral: true
        })

        if (!validUser(interaction.user.id)) return interaction.reply({
            content: "Please use \`/onboarding\` command to add yourself first.",
            ephemeral: true
        })

        if (!validSkill(skill)) return interaction.reply({
            content: "Sorry, skill you chose is not valid.",
            ephemeral: true
        })

        await interaction.deferReply();
        const [result, error] = await addSkillToMember(
            {
                skillID: skill,
                memberID: user,
                authorID: interaction.user.id
            }
        );

        if (error) return interaction.followUp({
            content: `Error occured: \`${error.response.errors[0].message}\``,
            ephemeral: true
        })

        const member = interaction.guild.members.cache.get(user);
        if (!member) return interaction.followUp({
            content: `Sorry, cannot find this member in the Discord but your request has been handled.`,
            ephemeral: true
        })
        
        if (member.user.bot) return interaction.followUp({
            content: `Sorry, you cannot support a bot.`,
            ephemeral: true
        })

        const DMchannel = await member.user.createDM();

        const {DMresult ,DMerror} = await awaitWrap(DMchannel.send({
            content: `${interaction.member.displayName} skilled you with ${skill}`
        }), "DMresult", "DMerror");

        if (validSkill(skill)){
            const skillName = myCache.get("skills").filter(value => value._id == skill)[0].tagName
            if (DMerror) return interaction.followUp({
                content: `<@${user}>: I cannot DM you.\n${interaction.member.displayName} just skilled you with \`${skillName}\`!`
            })
            else return interaction.followUp({
                content: 'DM is sent.',
                ephemeral: true
            })
        }else return interaction.followUp({
            content: "Sorry, skill you chose is not valid, but your request has been handled. ",
            ephemeral: true
        })
    }

}