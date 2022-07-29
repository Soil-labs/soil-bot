const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { validUser, insertVerticalBar, validSkill } = require('../helper/util');
const { matchMemberToUser, matchMemberToSkill, fetchUserDetail } = require('../helper/graphql');
const { sprintf } = require('sprintf-js');
const CONSTANT = require("../helper/const");
const _ = require("lodash")

require("dotenv").config()

module.exports = {
    commandName: "match",
    description: "Find a potential member matching your skills or check others matching cases",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addSubcommand(command =>
                command.setName("user")
                    .setDescription("Find a potential member matching your skills or check others matching cases")
                    .addUserOption(option =>
                        option.setName("user")
                        .setDescription("Choose a user you'd like to know his/her cases")))

            .addSubcommand(command =>
                command.setName("skill")
                    .setDescription("Find members with skills")
                    .addStringOption(option =>
                        option.setName("skill_1")
                        .setDescription("Choose a skill")
                        .setAutocomplete(true)
                        .setRequired(true))
                    .addStringOption(option =>
                        option.setName("skill_2")
                        .setDescription("Choose a skill")
                        .setAutocomplete(true))
                    .addStringOption(option =>
                        option.setName("skill_3")
                        .setDescription("Choose a skill")
                        .setAutocomplete(true))
                    .addStringOption(option =>
                        option.setName("skill_4")
                        .setDescription("Choose a skill")
                        .setAutocomplete(true)))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        let matchResult, authorName, userId, avatarURL;
        if (interaction.options.getSubcommand() == "user"){
            let targetUser;
            let userDetailErrorContent, noSkillContent;

            const user = interaction.options.getUser("user");

            if (user){
                if (user.bot) return interaction.reply({
                    content: "Sorry, you cannot choose a bot as a target user.",
                    ephemeral: true
                })
                targetUser = user;
                userDetailErrorContent = `Sorry, we cannot find a match for you. Error occured when fetching his/her profile: \`%s\`.`;
                noSkillContent = `Sorry, we cannot find a match for you because this member doesn't have any skill.`
            }else {
                targetUser = interaction.user;
                userDetailErrorContent = `Sorry, we cannot find a match for you. Error occured when fetching your profile: \`%s\`.`;
                noSkillContent = `Sorry, we cannot find a match for you because you don't have any skill. Try to find someone to endorse you!`
            }

            const isValidUser = validUser(targetUser.id);

            if (!isValidUser) return interaction.reply({
                content: "Sorry, you are not a member of Soil. Please use \`/onboard\` command to join in our family!",
                ephemeral: true
            })
            await interaction.deferReply({
                ephemeral: true
            })
            const [tmpResult, matchError] = await matchMemberToUser({ memberId: targetUser.id });

            if (matchError) return interaction.followUp({
                content: `Error occured when matching: \`${matchError.response.errors[0].message}\``
            })

            if (tmpResult.length == 0) {
                const [userDetail, userDetailError] = await fetchUserDetail({ userID: targetUser.id });

                if (userDetailError) return interaction.followUp({
                    content: sprintf(userDetailErrorContent, error.response.errors[0].message)
                })

                if (!userDetail.skills.length) return interaction.followUp({
                    content: noSkillContent
                })

                return interaction.followUp({
                    content: `Sorry, we cannot find a match for you without a detailed reason. Please report this case to our team.`
                })
            }
            matchResult = tmpResult;
            authorName = `@${targetUser.username} - Member Matching Results`;
            avatarURL = targetUser.avatarURL();
            userId = targetUser.id
        }else{
            const skills = _.uniq([
                interaction.options.getString("skill_1"),
                interaction.options.getString("skill_2"),
                interaction.options.getString("skill_3"),
                interaction.options.getString("skill_4")
            ].filter(value => validSkill(value)))

            if (skills.length == 0) return interaction.reply({
                content: "Please choose at least one option",
                ephemeral: true
            })

            await interaction.deferReply({
                ephemeral: true
            })

            const [tmpResult, matchError] = await matchMemberToSkill({ skillsID: skills });

            if (matchError) return interaction.followUp({
                content: `Error occured when matching: \`${matchError.response.errors[0].message}\``
            })

            if (tmpResult.length == 0) return interaction.followUp({
                content: "Sorry, I cannot find a member with these skills"
            })
            matchResult = tmpResult;
            authorName = `@${interaction.user.username} - Skill Matching Results`;
            avatarURL = interaction.user.avatarURL();
            userId = interaction.user.id;
        }

        let fields = [];
        const top3Match = matchResult.sort((first, second) => {
            return second.matchPercentage - first.matchPercentage
        }).splice(0, 3);
        let matchField = "", nameField = "", skillField = ""
        top3Match.forEach((value) => {
            const memberInGuild = interaction.guild.members.cache.get(value.member._id);
            const name = memberInGuild ? `<@${value.member._id}>` : value.member.discordName;
            const matchLink = memberInGuild ? sprintf("[%d%%](%s)", value.matchPercentage, sprintf(CONSTANT.LINK.USER, memberInGuild.id)) 
                : sprintf("%d%%", value.matchPercentage);
            const top2Skill = value.commonSkills.map(value => value.name).splice(0, 2);
            const skillList = top2Skill.length ? insertVerticalBar(value.commonSkills.map(value => value.name).splice(0, 2)) : "No common skill"
    
            matchField += `${matchLink}\n`;
            nameField += `${name}\n`;
            skillField += `${skillList}\n`;
        });

        let embedDescription
        if (top3Match.length == 0) embedDescription = CONSTANT.CONTENT.MATCH_SKILL_FALL;
        else {
            embedDescription = sprintf(CONSTANT.CONTENT.MATCH_SKILL, { matchNum: top3Match.length });
            fields.push(
                {
                    name: "⚙️MATCH",
                    value: matchField,
                    inline: true
                },
                {
                    name: "🧙NAME",
                    value: nameField,
                    inline: true
                },
                {
                    name: "💻SKILL",
                    value: skillField,
                    inline: true
                }
            )
        }

        return interaction.followUp({
            embeds: [
                new MessageEmbed()
                    .setDescription(embedDescription)
                    .setAuthor({ name: authorName, iconURL: avatarURL, url: sprintf(CONSTANT.LINK.USER, userId) })
                    .setColor(CONSTANT.MESSAGE_SETTING.EMBED_COLOR)
                    .addFields(fields)
            ]
        })

    }

}