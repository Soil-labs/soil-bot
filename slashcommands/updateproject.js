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

        const [projectDetail, projectError] = await fetchProjectDetail({ projectID: updateProjectId });

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
            const result = await this._updateProject(projectUpdateInfor);

            if (result.error) return interaction.followUp({
                content: `Error occured when updating your tweet: \`${result.message}\``
            })

            return interaction.followUp({
                content: "Project you chose does not have any champion. Your tweet has been approved automatically. 🌱View it in the project feed 🔗 link to project update feed."
            })

        }else{
            const champion = interaction.guild.members.cache.get(championId);
            if (!champion) return interaction.followUp({
                content: "Please check the ID of the champion of this project."
            })
            await interaction.followUp({
                content: `Waiting for approve from \`${champion.displayName}\`...`
            })
            const dmChannel = await champion.createDM();
            const infor = {
                newTweetMemberName: interaction.member.displayName,
                newTweetContent: updateNews,
                championId: championId
            }
            const { dmMessage, dmError } = await awaitWrap(dmChannel.send({
                content: sprintf(CONSTANT.CONTENT.NEW_TWEET_PROJECT_CHAMPION_DM, infor),
                components: [
                    new MessageActionRow()
                        .addComponents([
                            new MessageButton()
                                .setCustomId("new_tweet_project_yes")
                                .setLabel("Yes")
                                .setEmoji("✅")
                                .setStyle("PRIMARY"),
                            new MessageButton()
                                .setCustomId("new_tweet_project_no")
                                .setLabel("No")
                                .setEmoji("❌")
                                .setStyle("SECONDARY")
                        ])
                ]
            }), "dmMessage", "dmError")

            if (dmError){
                const channelMessage = await interaction.channel.send({
                    content: sprintf(CONSTANT.CONTENT.NEW_TWEET_PROJECT_CHAMPION_DM_FAIL, infor),
                    components: [
                        new MessageActionRow()
                            .addComponents([
                                new MessageButton()
                                    .setCustomId("new_tweet_project_yes")
                                    .setLabel("Yes")
                                    .setEmoji("✅")
                                    .setStyle("PRIMARY"),
                                new MessageButton()
                                    .setCustomId("new_tweet_project_no")
                                    .setLabel("No")
                                    .setEmoji("❌")
                                    .setStyle("SECONDARY")
                            ])
                    ]
                });
                const filter = i => true
                const collector = channelMessage.createMessageComponentCollector({
                    componentType: "BUTTON",
                    filter,
                    time: CONSTANT.NUMERICAL_VALUE.BUTTON_COLLECTOR_INTERVAL * 1000
                });
                collector.on("collect", async(btnInteraction) => {
                    if (btnInteraction.user.id != champion.id){
                        btnInteraction.reply({
                            content: "Sorry, you are not allowed to trigger this button.",
                            ephemeral: true
                        })
                    }else{
                        await btnInteraction.deferUpdate();
                        btnInteraction.message.edit({
                            content: `Your choice is well-received and we will notify \`${interaction.member.displayName}\``,
                            components: []
                        })
                        if (btnInteraction.customId == "new_tweet_project_yes"){
                            const updateResult = await this._updateProject(projectUpdateInfor);

                            if (updateResult.error) interaction.editReply({
                                content: `Your tweet has been approved by champion \`${champion.displayName}\`, but error occured when updating your tweet: \`${updateResult.message}\``
                            })
                            else interaction.editReply({
                                content: `Your tweet has been approved by champion \`${champion.displayName}\`. 🌱View it in the project feed 🔗 link to project update feed.`
                            })
                        }else {
                            interaction.editReply({
                                content: `Sorry, \`${champion.displayName}\` does not approve your request. You tweet will not be uploaded.`
                            })
                        }
                        collector.stop();
                    }
                })

                collector.on("end", async(collected, reason) => {
                    //Time out, the champion does not click the buttons
                    if (reason == "time"){
                        await channelMessage.edit({
                            content: "Sorry, time out. You failed to make a decision on this tweet request.",
                            components: []
                        })
                        interaction.editReply({
                            content: "Sorry, none of champion makes a descision on your tweet request. Please try again later."
                        })
                    }
                });
                
            }else{
                const dmChannelCollector = dmChannel.createMessageComponentCollector({
                    max: 1,
                    componentType: "BUTTON",
                    time: CONSTANT.NUMERICAL_VALUE.BUTTON_COLLECTOR_INTERVAL * 1000
                });
                
                dmChannelCollector.on("collect", async(btnInteraction) => {
                    await btnInteraction.deferUpdate();
                    btnInteraction.message.edit({
                        content: `Your choice is well-received and we will notify \`${interaction.member.displayName}\``,
                        components: []
                    })
                    if (btnInteraction.customId == "new_tweet_project_yes"){
                        const updateResult = await this._updateProject(projectUpdateInfor);

                        if (updateResult.error) interaction.editReply({
                            content: `Your tweet has been approved by champion \`${champion.displayName}\`, but error occured when updating your tweet: \`${updateResult.message}\``
                        })
                        else interaction.editReply({
                            content: `Your tweet has been approved by champion \`${champion.displayName}\`. 🌱View it in the project feed 🔗 link to project update feed.`
                        })
                    }else {
                        interaction.editReply({
                            content: `Sorry, \`${champion.displayName}\` does not approve your request. You tweet will not be uploaded.`
                        })
                    }
                })

                dmChannelCollector.on("end", async(collected) => {
                    if (collected.size == 0){
                        await dmMessage.edit({
                            content: "Sorry, time out. You failed to make a decision on this tweet request.",
                            components: []
                        })
                        interaction.editReply({
                            content: "Sorry, none of champion makes a descision on your tweet request. Please try again later."
                        })
                    }
                })
            }
        }

    },
    
    async _updateProject(updateInfor){
        const [result, error] = await newTweetProject(updateInfor);

        if (error) return {
            error: true,
            message: error.response.errors[0].message
        }

        return {
            error: false
        }
    }

}