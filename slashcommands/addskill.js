const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");
const myCache = require('../helper/cache');
const { addSkillToMember, addSkill } = require('../helper/graphql');
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
                    .setDescription("Choose a skill from the list or create a new one")
                    .setRequired(true)
                    .setAutocomplete(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const user = interaction.options.getString('user');
        let skill = interaction.options.getString('skill')

        if (!validUser(user)) return interaction.reply({
            content: "Sorry, user you chose is not valid, please use \`/onboarding\` command to add him/her first.",
            ephemeral: true
        })

        if (!validUser(interaction.user.id)) return interaction.reply({
            content: "Please use \`/onboarding\` command to add yourself first.",
            ephemeral: true
        })

        await interaction.deferReply({
            ephemeral: true
        });

        if (!validSkill(skill)){
            await interaction.followUp({
                content: "Creating a new skill for you...",
            })
            const [newSkill, newSkillError] = await addSkill({ tagName: skill });
            if (newSkillError) return interaction.editReply({
                content: `Error occured: \`${newSkillError.response.errors[0].message}\``
            })
            await interaction.editReply({
                content: `A new skill \`${skill}\` has been created.`,
            })
            myCache.set("skills", [
                ...myCache.get("skills"),
                {
                    _id: newSkill._id,
                    tagName: skill
                }
            ]);
            skill = newSkill._id;
        }

        const [result, error] = await addSkillToMember(
            {
                skillID: skill,
                memberID: user,
                authorID: interaction.user.id
            }
        );

        if (error) return interaction.editReply({
            content: `Error occured: \`${error.response.errors[0].message}\``,
        })

        const member = interaction.guild.members.cache.get(user);
        if (!member) return interaction.editReply({
            content: `Sorry, cannot find this member in the Discord but you have skilled this user successfully.`,
        })
        
        if (member.user.bot) return interaction.editReply({
            content: `Sorry, you cannot support a bot.`,
        })

        const DMchannel = await member.user.createDM();

        const {DMresult ,DMerror} = await awaitWrap(DMchannel.send({
            content: `${interaction.member.displayName} skilled you with ${skill}`
        }), "DMresult", "DMerror");

        if (validSkill(skill)){
            const skillName = myCache.get("skills").filter(value => value._id == skill)[0].tagName
            if (DMerror){
                interaction.channel.send({
                    content: `<@${user}>: I cannot DM you.\n${interaction.member.displayName} just skilled you with \`${skillName}\`!`
                })
                return interaction.editReply({
                    content: `Broadcast has been sent to the channel <#${interaction.channel.id}>.`
                })
            }
            else return interaction.editReply({
                content: 'DM is sent.',
            })
        }else return interaction.editReply({
            content: "Sorry, skill you chose is not valid, but you have skilled this user successfully. ",
        })
    }

}