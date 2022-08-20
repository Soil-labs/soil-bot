const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { validUser, insertVerticalBar, validSkill } = require('../helper/util');
const { matchMemberToSkill, matchMemberToProject, fetchUserDetail } = require('../helper/graphql');
const { sprintf } = require('sprintf-js');
const CONSTANT = require("../helper/const");
const _ = require("lodash")


module.exports = {
    commandName: "find",
    description: "Find matches for a person with similar skillsets",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)

            .addSubcommand(command =>
                command.setName("project")
                    .setDescription("Find projects that match your profile"))
                    
            .addSubcommand(command =>
                command.setName("fren")
                    .setDescription("Find member profiles in the community")
                    .addUserOption(option =>
                        option.setName("fren")
                        .setDescription("Pick up your fren")
                        .setRequired(true)))

            .addSubcommand(command =>
                command.setName("skill")
                    .setDescription("Find members with a particular set of skills")
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
        const guildId = interaction.guild.id;
        const subCommand = interaction.options.getSubcommand();
        if (subCommand == "project"){
            await interaction.deferReply({ ephemeral: true });

            const [ matchResult, error ] = await matchMemberToProject({ 
                memberId: interaction.user.id,
                serverId: [guildId]
            });
            if (error) return interaction.followUp({
                content: `Error occured when fetching his/her profile: \`${error}\`.`
            })

            let matchField = '', projectField = '', skillField = '';
            const top3Match = matchResult.sort((first, second) => {
                return second.matchPercentage - first.matchPercentage
            }).slice(0, 3);

            top3Match.forEach((value) => {
                matchField += sprintf("%d%%\n", value.matchPercentage);
                projectField += `${value.projectData.title}\n`;
                const skillNames = insertVerticalBar(value.role.skills.slice(0, 2).map((value) => value.skillData.name));
                skillField += sprintf("%s: %s", value.role.title, skillNames);
            });

            let embedDescription, fields = [];
            if (top3Match.length == 0) embedDescription = sprintf(CONSTANT.CONTENT.MATCH_PROJECT, CONSTANT.LINK.PROJECT_ALL);
            else {
                embedDescription = sprintf(CONSTANT.CONTENT.MATCH_PROJECT, CONSTANT.LINK.PROJECT_ALL);
                fields.push(
                    {
                        name: "Match 🤝",
                        value: matchField,
                        inline: true
                    },
                    {
                        name: "Project 🌳",
                        value: projectField,
                        inline: true
                    },
                    {
                        name: "Skill 🛠️",
                        value: skillField,
                        inline: true
                    }
                )
            }
            const authorName = `@${interaction.user.username} - Project Matching Results`;
            return interaction.followUp({
                embeds: [
                    new MessageEmbed()
                        .setTitle("Projects handpicked for you from Eden🪄")
                        .setDescription(embedDescription)
                        .setAuthor({ name: authorName, iconURL: interaction.user.avatarURL()})
                        .setColor(CONSTANT.MESSAGE_SETTING.EMBED_COLOR)
                        .addFields(fields)
                ]
            })
        }

        if (subCommand == "fren"){
            const frenUser = interaction.options.getUser("fren");

            if (frenUser.bot) return interaction.reply({
                content: "Sorry, you cannot choose a bot.",
                ephemeral: true
            })

            const member = validUser(frenUser.id, guildId);
            // if (!member && frenUser.id == interaction.user.id) return interaction.reply({
            //     content: "Sorry, we cannot find your information, use \`/onboard\` command to join.",
            //     ephemeral: true
            // })

            if (!member) return interaction.reply({
                content: "Sorry, we cannot find information of this user.",
                ephemeral: true
            })

            await interaction.deferReply({ ephemeral: true });
            const [userDetail, error] = await fetchUserDetail({ userID: frenUser.id });
            if (error) return interaction.followUp({
                content: `Error occured: \`${error}\``,
            });

            const userLink = sprintf(CONSTANT.LINK.USER, frenUser.id)
            const userEmbed = new MessageEmbed()
                .setTitle(sprintf("@%s - Personal Tagline", frenUser.username))
                .setThumbnail(member?.discordAvatar)
            
            let skillNames = userDetail.skills.map(value => value.skillInfo.name ?? "Unknown skill name");
            let top3Skills = '';
            skillNames = skillNames.splice(0, 3);
            if (skillNames.length == 0) top3Skills = "No skill";
            else top3Skills = insertVerticalBar(skillNames);

            let projects = userDetail.projects.map(value => value.info?.title ?? "Unknown project name");
            if (projects.length == 0) projects = "No project";
            else projects = insertVerticalBar(projects);
            
            // let attributes = userDetail.attributes;
            // let top3Attributes;
            // attributes = Object.keys(attributes)
            //     .filter((value) => (attributes[value]))
            //     .sort((a, b) => attributes[b] - attributes[a]).map((value) => (`${value}(${attributes[value]})`)).splice(0, 3);
            // if (attributes.length == 0) top3Attributes = "No attribute"
            // else top3Attributes = insertVerticalBar(attributes)
            
            userEmbed.setDescription(sprintf("🛠**Skills**: %s\n\n🗓️**Availability**: %f h/week\n\n🌳**Projects**: %s\n\n🔗Click [here](%s) to see <@%s>'s profile",
                top3Skills, userDetail.hoursPerWeek ?? 0, projects, userLink, frenUser.id))
            
            return interaction.followUp({
                embeds: [userEmbed]
            })
        }

        if (subCommand == "skill"){        
            const skills = _.uniq([
                interaction.options.getString("skill_1"),
                interaction.options.getString("skill_2"),
                interaction.options.getString("skill_3"),
                interaction.options.getString("skill_4")
            ].filter(value => validSkill(value)))

            if (skills.length == 0) return interaction.reply({
                content: "Please choose at least valid option",
                ephemeral: true
            })

            await interaction.deferReply({
                ephemeral: true
            })

            let [matchResult, matchError] = await matchMemberToSkill({
                skillsId: skills,
                serverId: [guildId]
            });

            if (matchError) return interaction.followUp({
                content: `Error occured when matching: \`${matchError}\``
            })

            if (matchResult.length == 0) return interaction.followUp({
                content: "Sorry, I cannot find a member with these skills"
            })

            const authorName = `@${interaction.user.username} - Skill Matching Results`;
            const avatarURL = interaction.user.avatarURL();
            const userId = interaction.user.id;
            matchResult = matchResult.filter((result) => result.member._id != interaction.user.id);
            // if (matchResult.length == 1){
            //     const memberInGuild = interaction.guild.members.cache.get(matchResult[0].member._id);
            //     const name = memberInGuild ? `🧙<@${memberInGuild.id}>` : `\`🧙@${matchResult[0].member.discordName}\``;
            //     return interaction.followUp({
            //         embeds: [
            //             new MessageEmbed()
            //                 .setTitle("All the people with your requested skills")
            //                 .setDescription(name)
            //         ]
            //     })
            // }

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
            fields.push(
                {
                    name: "Match 🤝",
                    value: matchField,
                    inline: true
                },
                {
                    name: "Member 🧙",
                    value: nameField,
                    inline: true
                },
                {
                    name: "Skill 🛠️",
                    value: skillField,
                    inline: true
                }
            )
            
            return interaction.followUp({
                embeds: [
                    new MessageEmbed()
                        .setTitle("All the people with your requested skills")
                        .setAuthor({ name: authorName, iconURL: avatarURL, url: sprintf(CONSTANT.LINK.USER, userId) })
                        .setColor(CONSTANT.MESSAGE_SETTING.EMBED_COLOR)
                        .addFields(fields)
                ]
            })

        }
    }

}