const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { fetchProjectDetail, fetchUserDetail, fetchSkillDetail } = require('../helper/graphql');
const { validUser, validProject, insertVerticalBar, validSkill } = require('../helper/util');
const CONSTANT = require("../helper/const");
const myCache = require('../helper/cache');
const sprintf = require('sprintf-js').sprintf;

require("dotenv").config()

module.exports = {
    commandName: "search",
    description: "Search everything in Soil🌱",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addSubcommand(command =>
                command.setName("all_projects")
                    .setDescription("Output all projects information"))
            .addSubcommand(command =>
                command.setName("for")
                    .setDescription("Search for projects, users or skills")
                    .addUserOption(option =>
                        option.setName("user")
                            .setDescription("Choose a user from the list"))
                    .addStringOption(option =>
                        option.setName("project_name")
                            .setDescription("Choose a project from the list")
                            .setAutocomplete(true))
                    .addStringOption(option =>
                        option.setName("skill")
                            .setDescription("Choose a skill from the list")
                            .setAutocomplete(true))
            )
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {

        if (interaction.options.getSubcommand() == "all_projects"){
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle(sprintf("🪄Total projects in DAO: %d", myCache.get("projects").length))
                        .setDescription(sprintf("🔗Click [here](%s) to see all projects", CONSTANT.LINK.PROJECT_GATEWAY))
                ],
                ephemeral: true
            })
        }

        if (interaction.options._hoistedOptions.length == 0) {
            return interaction.reply({
                content: "Please choose at least one option.",
                ephemeral: true
            })
        }

        const user = interaction.options.getUser("user");
        const projectId = interaction.options.getString("project_name");
        const skillId = interaction.options.getString("skill");

        if (user && projectId && skillId) return interaction.reply({
            content: "Please choose one option in this command.",
            ephemeral: true
        })

        if (user){
            if (user.bot) return interaction.reply({
                content: "Sorry, you cannot choose a bot as a target.",
                ephemeral: true
            })

            const member = validUser(user.id);
            if (!member && user.id == interaction.user.id) return interaction.reply({
                content: "Sorry, we cannot find your information, use \`/onboard\` command to join.",
                ephemeral: true
            })

            if (!member) return interaction.reply({
                content: "Sorry, we cannot find information of this user.",
                ephemeral: true
            })

            await interaction.deferReply({ ephemeral: true });
            const [userDetail, error] = await fetchUserDetail({ userID: user.id });
            if (error) return interaction.followUp({
                content: `Error occured: \`${error.response.errors[0].message}\``,
            });

            const userLink = sprintf(CONSTANT.LINK.USER, user.id)
            const userEmbed = new MessageEmbed()
                .setTitle(sprintf("%s Personal Tagline", user.username))
                .setThumbnail(member?.discordAvatar)
            
            let skillNames = userDetail.skills.map(value => value.name ?? "Unknown skill name");
            let top3Skills = '';
            skillNames = skillNames.splice(0, 3);
            if (skillNames.length == 0) top3Skills = "No skill";
            else top3Skills = insertVerticalBar(skillNames);

            let projects = userDetail.projects.map(value => value.info?.title ?? "Unknown project name");
            if (projects.length == 0) projects = "No project";
            else projects = insertVerticalBar(projects);
            
            userEmbed.setDescription(sprintf("🛠**Top 3 Skills**: %s\n\n✅**Current Availability**: %f h/week\n\n🌱**Current Projects**: %s\n\n🔗Click [here](%s) to see the profile",
                top3Skills, userDetail.hoursPerWeek ?? 0, projects, userLink))
            return interaction.followUp({
                embeds: [userEmbed]
            })
        }

        if (projectId){
            if (!validProject(projectId)) return interaction.reply({
                content: "Sorry, we cannot find information of this project.",
                ephemeral: true
            })
            await interaction.deferReply({ ephemeral: true });
            const [result, error] = await fetchProjectDetail({ projectID: projectId });
            if (error) return interaction.followUp({
                content: `Error occured: \`${error.response.errors[0].message}\``
            })

            const projectLink = sprintf(CONSTANT.LINK.PROJECT, projectId)
            const projectEmbed = new MessageEmbed()
                .setTitle(sprintf("✨%s", result.title ?? "No title"))
                .setDescription(sprintf("✅ **Status**: %s\n\n👨‍👩‍👧‍👦 **Open Roles**: %d\n\n🔗 Click [here](%s) to see its profile\n\n📣**Recent Announcement**", 
                    result.status ?? "⚙️pre-launch | 🚀launched | 📦archived", result.role.length, projectLink))
            let tweets = [];
            result.tweets.forEach((value) => {
                tweets.push(
                    {
                        name: "Content",
                        value: value.content ?? "No content",
                        inline: true
                    },
                    {
                        name: "Author",
                        value: `\`${value.author?.discordName ?? "anonymous"}\``,
                        inline: true
                    },
                    {
                        name: "Time",
                        value: `<t:${Math.floor(parseInt(value.registeredAt)/1000)}>`,
                        inline: true
                    }
                )
            })
            return interaction.followUp({
                content: `Here is the project ${result.title ?? "No Title"} information.`,
                embeds: [projectEmbed.addFields(tweets)]
            })
        }

        if (skillId){
            if (!validSkill(skillId)) return interaction.reply({
                content: "Sorry, we cannot find information of this skill.",
                ephemeral: true
            })
            await interaction.deferReply({ ephemeral: true });
            const [result, error] = await fetchSkillDetail({ skillID: skillId });
            if (error) return interaction.followUp({
                content: `Error occured: \`${error.response.errors[0].message}\``
            })
            const skillLink = sprintf(CONSTANT.LINK.SKILL, skillId);

            let skilledMember = result.members.filter(value => interaction.guild.members.cache.get(value._id))
                .map(value => `<@${value._id}>`)
            if (skilledMember.length == 0) skilledMember = "No one has this skill in this Discord Server."
            else skilledMember = insertVerticalBar(skilledMember);

            const skillEmbed = new MessageEmbed()
                .setTitle(sprintf("Skill %s Dashboard", result.name ?? "No skill name"))
                .setDescription(sprintf("🧙**People with this skill**: %s\n\n🔗 Click [here](%s) for skill details", skilledMember, skillLink));
            
            return interaction.followUp({
                embeds: [skillEmbed]
            })
        }
    }

}