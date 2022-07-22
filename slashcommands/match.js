const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { validUser, insertVerticalBar, validSkill } = require('../helper/util');
const { matchMemberToUser, matchMemberToSkill, fetchUserDetail } = require('../helper/graphql');
const { sprintf } = require('sprintf-js');
const { AsciiTable3, AlignmentEnum } = require('ascii-table3');
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
                        option.setName("user_name")
                        .setDescription("Choose a user you'd like to know his/her cases")))

            .addSubcommand(command =>
                command.setName("skill")
                    .setDescription("one skill")
                    .addStringOption(option =>
                        option.setName("skill_name_1")
                        .setDescription("Choose a skill")
                        .setAutocomplete(true)
                        .setRequired(true)))

            .addSubcommand(command =>
                command.setName("skill_2")
                    .setDescription("two skill")
                    .addStringOption(option =>
                        option.setName("skill_name_1")
                        .setDescription("Choose a skill")
                        .setAutocomplete(true)
                        .setRequired(true))
                    .addStringOption(option =>
                        option.setName("skill_name_2")
                        .setDescription("Choose a skill")
                        .setAutocomplete(true)
                        .setRequired(true)))

            .addSubcommand(command =>
                command.setName("skill_3")
                    .setDescription("three skill")
                    .addStringOption(option =>
                        option.setName("skill_name_1")
                        .setDescription("Choose a skill")
                        .setAutocomplete(true)
                        .setRequired(true))
                    .addStringOption(option =>
                        option.setName("skill_name_2")
                        .setDescription("Choose a skill")
                        .setAutocomplete(true)
                        .setRequired(true))
                    .addStringOption(option =>
                        option.setName("skill_name_3")
                        .setDescription("Choose a skill")
                        .setAutocomplete(true)
                        .setRequired(true)))
            
            .addSubcommand(command =>
                command.setName("skill_4")
                    .setDescription("four skill")
                    .addStringOption(option =>
                        option.setName("skill_name_1")
                        .setDescription("Choose a skill")
                        .setAutocomplete(true)
                        .setRequired(true))
                    .addStringOption(option =>
                        option.setName("skill_name_2")
                        .setDescription("Choose a skill")
                        .setAutocomplete(true)
                        .setRequired(true))
                    .addStringOption(option =>
                        option.setName("skill_name_3")
                        .setDescription("Choose a skill")
                        .setAutocomplete(true)
                        .setRequired(true))
                    .addStringOption(option =>
                        option.setName("skill_name_4")
                        .setDescription("Choose a skill")
                        .setAutocomplete(true)
                        .setRequired(true)))
                    
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        if (interaction.options.getSubcommand() == "user"){
            let targetUser;
            let userDetailErrorContent, noSkillContent;

            const user = interaction.options.getUser("user");

            if (user){
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
            const [matchResult, matchError] = await matchMemberToUser({ memberId: targetUser.id });

            if (matchError) return interaction.followUp({
                content: `Error occured when matching: \`${matchError.response.errors[0].message}\``
            })

            if (matchResult.length == 0) {
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
            const table = new AsciiTable3(`${targetUser.username} Matching Result`)
                .setHeading("⚙️Similarity", "🧙Name", "💻Common Skills")
                .setAlign(3, AlignmentEnum.CENTER);

            const matchContent = matchResult.sort((first, second) => {
                return second.matchPercentage - first.matchPercentage
            }).map((value) => {
                const memberInGuild = interaction.guild.members.cache.get(value.member._id);
                const name = memberInGuild ? `<@${value.member._id}>` : value.member.discordName ;
                const skillList = insertVerticalBar(value.commonSkills.map(value => value.name));
                table.addRow(sprintf("%.2f%%", value.matchPercentage), value.member.discordName, skillList)
                return sprintf("> ⚙️Similarity: %.2f%%   🧙Name: %s 💻Common Skill: %s\n", value.matchPercentage, name, skillList);
            }).toString().replace(/,/g, '');

            return interaction.followUp({
                content: table.toString(),
                embeds: [
                    new MessageEmbed()
                        .setTitle(`${interaction.member.displayName} Matching Result`)
                        .setDescription(matchContent)
                ]
            })
        }

        const skills = _.uniq([
            interaction.options.getString("skill_name_1"),
            interaction.options.getString("skill_name_2"),
            interaction.options.getString("skill_name_3"),
            interaction.options.getString("skill_name_4")
        ].filter(value => validSkill(value)))

        await interaction.deferReply({
            ephemeral: true
        })

        const [matchResult, matchError] = await matchMemberToSkill({ skillsID: skills });

        if (matchError) return interaction.followUp({
            content: `Error occured when matching: \`${matchError.response.errors[0].message}\``
        })

        if (matchResult.length == 0) return interaction.followUp({
            content: "Sorry, I cannot find a member with these skills"
        })

        const table = new AsciiTable3("Skill Matching Result")
                .setHeading("⚙️Similarity", "🧙Name", "💻Common Skills")
                .setAlign(3, AlignmentEnum.CENTER);

        const matchContent = matchResult.sort((first, second) => {
                return second.matchPercentage - first.matchPercentage
            }).map((value) => {
                const memberInGuild = interaction.guild.members.cache.get(value.member._id);
                const name = memberInGuild ? `<@${value.member._id}>` : value.member.discordName ;
                const skillList = insertVerticalBar(value.commonSkills.map(value => value.name));
                table.addRow(sprintf("%.2f%%", value.matchPercentage), value.member.discordName, skillList)
                return sprintf("> ⚙️Similarity: %.2f%%   🧙Name: %s 💻Common Skill: %s\n", value.matchPercentage, name, skillList);
            }).toString().replace(/,/g, '');
        
            return interaction.followUp({
                content: table.toString(),
                embeds: [
                    new MessageEmbed()
                        .setTitle("Skill Matching Result")
                        .setDescription(matchContent)
                ]
        })

    }

}