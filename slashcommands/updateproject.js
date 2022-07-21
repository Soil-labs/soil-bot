const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageActionRow, MessageButton } = require("discord.js");
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
                option.setName("milestone_update")
                    .setDescription("News or announcement you'd like to report")
                    .setRequired(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const updateProjectId = interaction.options.getString("project_name");
        const userId = interaction.user.id;
        const updateNews = interaction.options.getString("milestone_update");

        await interaction.deferReply({
            ephemeral: true
        })
        
        if (!validProject(updateProjectId)) return interaction.followUp({
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

        const projectUpdateInfor = {
            projectID: updateProjectId,
            content: updateNews,
            author: userId
        }
        const championId = projectDetail.champion?._id;
        if (!championId) {
            return interaction.followUp({
                content: "Sorry, project you chose does not have any champion. Your tweet cannot be updated."
            })

        }else{
            //Champion herself/himself update a tweet for the project
            if (championId == interaction.user.id){
                const result = await this._updateProject({
                    ...projectUpdateInfor,
                    approved: true
                });

                if (result.error) return interaction.followUp({
                    content: `Error occured when updating your tweet: \`${result.message}\``
                })

                return interaction.followUp({
                    content: "New tweet to your project has been uploaded successfully."
                })
            }
             
            const result = await this._updateProject({
                ...projectUpdateInfor,
                approved: true
            });

            if (result.error) return interaction.followUp({
                content: `Error occured when updating your tweet: \`${result.message}\``
            })

            const champion = interaction.guild.members.cache.get(championId);
            if (!champion) return interaction.followUp({
                content: "New tweet to this project has been uploaded successfully but I cannot access this champion now."
            })

            const contentInfo = {
                newTweetMemberName: interaction.member.displayName,
                newTweetMemberId: interaction.user.id,
                newTweetContent: updateNews,
                projectId: updateProjectId,
                tweetId: result.tweetId,
                championId: champion.id
            }
            const dmChannel = await champion.createDM();
            const { dmResult, dmError } = await awaitWrap(dmChannel.send({
                content: sprintf(CONSTANT.CONTENT.NEW_TWEET_PROJECT_CHAMPION_DM, contentInfo)
            }))

            if (dmError){
                interaction.channel.send({
                    content: sprintf(CONSTANT.CONTENT.NEW_TWEET_PROJECT_CHAMPION_DM_FAIL, contentInfo)
                });

                return interaction.followUp({
                    content: "New tweet to this project has been uploaded successfully."
                })
            }

            return interaction.followUp({
                content: "New tweet to this project has been uploaded successfully. DM has been sent to the champion."
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