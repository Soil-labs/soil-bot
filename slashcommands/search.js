const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { fetchProjectDetail, fecthUserDetail } = require('../helper/graphql');
const myCache = require('../helper/cache');
const { validUser, validProject } = require('../helper/util');
const user = require('../autocomplete/user');
const sprintf = require('sprintf-js').sprintf;
require("dotenv").config()

module.exports = {
    commandName: "search",
    description: "Search a user or a project",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addUserOption(option =>
                option.setName("user")
                    .setDescription("Choose a user from the list"))
            .addStringOption(option =>
                option.setName("project_name")
                    .setDescription("Choose a project from the list")
                    .setAutocomplete(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        if (interaction.options._hoistedOptions.length == 0) {
            return interaction.reply({
                content: "Please choose at least one option.",
                ephemeral: true
            })
        }

        const user = interaction.options.getUser("user");
        const projectId = interaction.options.getString("project_name");

        if (user && projectId) return interaction.reply({
            content: "Please choose one option in this command.",
            ephemeral: true
        })

        if (user){
            if (user.bot) return interaction.reply({
                content: "Sorry, you cannot choose a bot as a target.",
                ephemeral: true
            })

            const member = validUser(user.id);
            if (!member) return interaction.reply({
                content: "Sorry, we cannot find information of this user.",
                ephemeral: true
            })

            await interaction.deferReply({ ephemeral: true });
            const userEmbed = new MessageEmbed()
                .setTitle(`${member?.discordName ?? "Unknown"} Profile`)
                .setThumbnail(member?.discordAvatar)
            const [userDetail, error] = await fecthUserDetail({ userID: user.id });
            if (error) return interaction.followUp({
                content: `Error occured: \`${error.response.errors[0].message}\``,
            });
            let fields = [];
            if (userDetail.skills.length == 0) fields.push({
                name: "skill",
                value: "No skill"
            })
            userDetail.skills.forEach((value) => {
                let endorsedBy = value.authors.map(value => value.discordName ?? "anonymous");
                if (endorsedBy.length == 0) endorsedBy = "Null"
                fields.push(
                    {
                        name: "skill",
                        value: value.tagName ?? "No skill name",
                        inline: true
                    },
                    {
                        name: "endorsed by",
                        value: `\`${endorsedBy.toString()}\``,
                        inline: true
                    },
                    {
                        name: "when",
                        value: `<t:${Math.floor(parseInt(value.registeredAt)/1000)}>`,
                        inline: true
                    }
                )
            });
            let projects = userDetail.projects.map(value => value.project?.tagName ?? "Unknow project name");
            if (projects.length == 0) projects = "\`No project\`";
            fields.push({
                name: "Project attended",
                value: `\`${projects.toString()}\``
            });
            return interaction.followUp({
                embeds: [userEmbed.addFields(fields)]
            })
        }

        if (projectId){
            if (!validProject(projectId)) return interaction.reply({
                content: "Sorry, we cannot find information of this project.",
                ephemeral: true
            })
            await interaction.deferReply({ ephemeral: true });
            const [result, error] = await fetchProjectDetail({projectID: projectId});
            if (error) return interaction.followUp({
                content: `Error occured: \`${error.response.errors[0].message}\``
            })
            const projectEmbed = new MessageEmbed()
                .setAuthor({name: result.tagName ?? "No tagName"})
                .setTitle(sprintf("Title: %s", result.title ?? "No title"))
                .setDescription(sprintf("Description: %s", result.description ?? "No description"))
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
                content: `Here is the project ${result.tagName ?? "No tagName"} information.`,
                embeds: [projectEmbed.addFields(tweets)]
            })
        }
    }

}