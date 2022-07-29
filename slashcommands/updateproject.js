const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");
const { newTweetProject, fetchProjectDetail } = require('../helper/graphql');
const { validUser, validProject, awaitWrap } = require('../helper/util');
const CONSTANT = require("../helper/const");
const { sprintf } = require('sprintf-js');

module.exports = {
    commandName: "update",
    description: "Report your project milestone.",

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
                option.setName("title")
                    .setDescription("Title of News or announcement you'd like to report")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("content")
                    .setDescription("Content of News or announcement you'd like to report"))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const updateProjectId = interaction.options.getString("project_name");
        const userId = interaction.user.id;
        const updateNewsTitle = interaction.options.getString("title");
        const updateNewsContent = interaction.options.getString("content");

        if (!updateNewsTitle && !updateNewsContent) return interaction.reply({
            content: "Sorry, you have to upload either \`title\` or \`content\`, or both.",
            ephemeral: true
        })

        let updateContent;
        if (updateNewsContent) updateContent = sprintf("**Title:** %s\n\n**Content:** %s", updateNewsTitle, updateNewsContent);
        else updateContent = sprintf("**Title:** %s", updateNewsTitle);

        await interaction.deferReply({
            ephemeral: true
        })
        
        const isValidProject = validProject(updateProjectId);

        if (!isValidProject) return interaction.followUp({
            content: "Sorry, we cannot find this project",
            ephemeral: true
        })
        if (!validUser(userId)) return interaction.followUp({
            content: "Sorry, you don't have access to update this project.",
            ephemeral: true
        })

        const [ projectDetail, projectError ] = await fetchProjectDetail({ projectID: updateProjectId });

        if (projectError) return interaction.followUp({
            content: `Error occured when fetching project details: \`${projectError.response.errors[0].message}\``
        })

        const projectUpdateInform = {
            projectID: updateProjectId,
            title: updateNewsTitle,
            content: updateNewsContent,
            author: userId
        }
        const championId = projectDetail.champion?._id;
        const embedAuthorName = `@${interaction.user.username} updated the project`;
        const tweetLink = sprintf(CONSTANT.LINK.PROJECT_TWEET, updateProjectId);
        const iconURL = interaction.user.avatarURL();
        const embedMessage = new MessageEmbed()
            .setAuthor({ name: embedAuthorName, url: tweetLink, iconURL: iconURL})
            .setTitle(`${isValidProject.title} Announcement`)
            .setColor(CONSTANT.MESSAGE_SETTING.EMBED_COLOR)
            .setTimestamp();
        const embedInform = {
            newTweetContent: updateContent,
            tweetLink: tweetLink
        }
        if (!championId) {
            const result = await this._updateProject({
                ...projectUpdateInform,
                approved: true
            });

            if (result.error) return interaction.followUp({
                content: `Error occured when updating this tweet: \`${result.message}\``
            })

            return interaction.followUp({
                content: "New tweet to this project has been uploaded successfully.",
                embeds: [
                    embedMessage.setDescription(
                        sprintf(CONSTANT.CONTENT.NEW_TWEET_PROJECT_NO_CHAMPION, embedInform))
                ]
            })
        }else{
            //Champion herself/himself update a tweet for the project
            if (championId == interaction.user.id){
                const result = await this._updateProject({
                    ...projectUpdateInform,
                    approved: true
                });

                if (result.error) return interaction.followUp({
                    content: `Error occured when updating your tweet: \`${result.message}\``
                })

                return interaction.followUp({
                    content: "New tweet to your project has been uploaded successfully.",
                    embeds: [
                        embedMessage.setDescription(
                            sprintf(CONSTANT.CONTENT.NEW_TWEET_PROJECT_CHAMPION_ME, embedInform))
                    ]
                })
            }
             
            const result = await this._updateProject({
                ...projectUpdateInform,
                approved: true
            });

            if (result.error) return interaction.followUp({
                content: `Error occured when updating your tweet: \`${result.message}\``
            })

            const champion = interaction.guild.members.cache.get(championId);
            if (!champion) return interaction.followUp({
                content: "New tweet to this project has been uploaded successfully but I cannot access this champion now."
            })

            const dmChannel = await champion.createDM();
            const { dmResult, dmError } = await awaitWrap(dmChannel.send({
                embeds: [
                    embedMessage.setDescription(
                        sprintf(CONSTANT.CONTENT.NEW_TWEET_PROJECT_CHAMPION_DM, embedInform))
                ]
            }))

            if (dmError){
                interaction.channel.send({
                    content: `<@${championId}>`,
                    embeds: [
                        embedMessage.setDescription(
                            sprintf(CONSTANT.CONTENT.NEW_TWEET_PROJECT_CHAMPION_DM_FAIL, embedInform))
                    ]
                });

                return interaction.followUp({
                    content: "New tweet to this project has been uploaded successfully."
                })
            }

            return interaction.followUp({
                content: `New tweet to this project has been uploaded successfully. DM has been sent to \`${champion.displayName}\`.`
            })
        }

    },
    
    async _updateProject(updateInfor){
        const [result, error] = await newTweetProject(updateInfor);

        if (error) return {
            error: true,
            message: error.response.errors[0].message
        }

        return {
            error: false,
            tweetId: result.newTweetID
        }
    }

}