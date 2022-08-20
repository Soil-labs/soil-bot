const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { sprintf } = require('sprintf-js');
const CONSTANT = require("../helper/const");
const { fetchProjectDetail } = require('../helper/graphql');
const { validProject, validUser, awaitWrap } = require('../helper/util');


module.exports = {
    commandName: "project",
    description: "Explore projects",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addSubcommand(command =>
                command.setName("new")
                    .setDescription("Launch a project in the community"))
            .addSubcommand(command =>
                command.setName("activity")
                    .setDescription("See key updates of a specific project")
                    .addStringOption(option =>
                        option.setName("project_name")
                            .setDescription("Choose the project you are interested in")
                            .setRequired(true)
                            .setAutocomplete(true)))
            // .addSubcommand(command =>
            //     command.setName("update")
            //         .setDescription("Share a key update for your project")
            //         .addStringOption(option =>
            //             option.setName("project_name")
            //                 .setDescription("Choose the project you are interested in")
            //                 .setRequired(true)
            //                 .setAutocomplete(true))
            //         .addStringOption(option =>
            //             option.setName("announcement")
            //                 .setDescription("Tell us the good news")
            //                 .setRequired(true)))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        if (subCommand == "new"){
            const launchProjectLink = sprintf(CONSTANT.LINK.LAUNCH_PROJECT, guildId)
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle("Let's BUIDL!🤩")
                        .setDescription(`🚀Click [here](${launchProjectLink}) to launch a new project`)
                ],
                ephemeral: true
            })
        }

        if (subCommand == "activity"){
            const projectId = interaction.options.getString("project_name");
            if (!validProject(projectId, guildId)) return interaction.reply({
                content: "Sorry, we cannot find information of this project.",
                ephemeral: true
            })

            await interaction.deferReply({ ephemeral: true });
            const [result, error] = await fetchProjectDetail({ projectID: projectId });
            if (error) return interaction.followUp({
                content: `Error occured: \`${error}\``
            })
            const projectName = result.title ?? "No title";
            const projectLink = sprintf(CONSTANT.LINK.PROJECT_TWEET, projectId);
            let championMember = interaction.guild.members.cache.get(result.champion._id);
            if (!championMember) championMember = result.champion.discordName ?? "Unknown Champion";
            else championMember = `<@${championMember.id}>`;
            const projectEmbed = new MessageEmbed()
                .setTitle(`@${projectName}`)
                .setDescription(sprintf("💪**Champion**: %s\n\n✅ **Status**: %s\n\n👨‍👩‍👧‍👦 **Open Roles**: %d\n\n🔗 Click [here](%s) to see more activity", 
                    championMember, "@NEW | @RUNNING", result.role.length, projectLink))

            return interaction.followUp({
                content: `Here's key info for @${projectName}`,
                embeds: [projectEmbed]
            })
        }

        if (subCommand == "update"){
            const projectId = interaction.options.getString("project_name");
            const announcement = interaction.options.getString("announcement");
            const userId = interaction.user.id;

            await interaction.deferReply({
                ephemeral: true
            })
            
            const isValidProject = validProject(projectId, guildId);

            if (!isValidProject) return interaction.followUp({
                content: "Sorry, we cannot find this project",
                ephemeral: true
            })

            if (!validUser(userId, guildId)) return interaction.followUp({
                content: "Sorry, you don't have access to update this project.",
                ephemeral: true
            })

            const [ projectDetail, projectError ] = await fetchProjectDetail({ projectID: projectId });

            if (projectError) return interaction.followUp({
                content: `Error occured when fetching project details: \`${projectError}\``
            })

            const projectUpdateInform = {
                projectID: updateProjectId,
                title: updateNewsTitle,
                content: updateNewsContent,
                author: userId
            };

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
            };

            //to-do update approve should be branched in the future.
            //currently we approve all update
            const result = await this._updateProject({
                ...projectUpdateInform,
                approved: true
            });
            if (!championId) {
                if (result.error) return interaction.followUp({
                    content: `Error occured when updating this announcement: \`${result.message}\``
                })

                return interaction.followUp({
                    content: "New announcement to this project has been uploaded successfully.",
                    embeds: [
                        embedMessage.setDescription(
                            sprintf(CONSTANT.CONTENT.NEW_TWEET_PROJECT_NO_CHAMPION, embedInform))
                    ]
                })
            }else{
                //Champion herself/himself update a tweet for the project
                if (championId == interaction.user.id){
                    if (result.error) return interaction.followUp({
                        content: `Error occured when updating your announcement: \`${result.message}\``
                    })

                    return interaction.followUp({
                        content: "New announcement to your project has been uploaded successfully.",
                        embeds: [
                            embedMessage.setDescription(
                                sprintf(CONSTANT.CONTENT.NEW_TWEET_PROJECT_CHAMPION_ME, embedInform))
                        ]
                    })
                }

                if (result.error) return interaction.followUp({
                    content: `Error occured when updating your announcement: \`${result.message}\``
                })

                const champion = interaction.guild.members.cache.get(championId);
                if (!champion) return interaction.followUp({
                    content: "New announcement to this project has been uploaded successfully but I cannot access this champion now."
                })

                if (process.env.SLASH_CMD_ENV == "production" && process.env.DM_OPTION == "false"){
                    // const {channelResult, chanelError} = await awaitWrap(interaction.channel.send({
                    //     content: `<@${championId}>`,
                    //     embeds: [
                    //         embedMessage.setDescription(
                    //             sprintf(CONSTANT.CONTENT.NEW_TWEET_PROJECT_CHAMPION_DM_FAIL, embedInform))
                    //     ]
                    // }), "channelResult", "chanelError");

                    // if (chanelError) return interaction.followUp({
                    //     content: "Permission denied, please check the permission of this channel. But your announcemnet has been uploaded successfully."
                    // })

                    return interaction.followUp({
                        content: "New announcement to this project has been uploaded successfully."
                    })
                }

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
                    //to-do
                    return interaction.followUp({
                        content: "New announcement to this project has been uploaded successfully."
                    })
                }

                return interaction.followUp({
                    content: `New announcement is now live on the project activity feed. DM has been sent to the champion for review.`
                })
            }
        }

    }

}