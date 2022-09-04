const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed, Modal, TextInputComponent, MessageActionRow } = require("discord.js");
const { newTweetProject, fetchProjectDetail, createProjectUpdate } = require('../helper/graphql');
const { validUser, validProject, awaitWrap, validTeam, validRole } = require('../helper/util');
const { sprintf } = require('sprintf-js');

const CONSTANT = require("../helper/const");
const _ = require("lodash");
const myCache = require('../helper/cache');

module.exports = {
    commandName: "update",
    description: "Report your project milestone.",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addSubcommand(commnad =>
                commnad.setName("project")
                    .setDescription("Update your project milestone")
                        .addStringOption(option =>
                            option.setName("project")
                                .setDescription("Choose a project from the list")
                                .setRequired(true)
                                .setAutocomplete(true))
                        .addStringOption(option =>
                            option.setName("announcement_title")
                                .setDescription("Title of News or announcement you'd like to report")
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName("announcement_content")
                                .setDescription("Content of News or announcement you'd like to report")))
            .addSubcommand(command =>
                command.setName("garden")
                    .setDescription("Update DAO garden")
                        .addStringOption(option =>
                            option.setName("project")
                                .setDescription("Choose a project from the list")
                                .setRequired(true)
                                .setAutocomplete(true))
                        .addStringOption(option =>
                            option.setName("team")
                                .setDescription("Team from this project")
                                .setAutocomplete(true)
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName("role")
                                .setDescription("Role you'd like to add in this team")
                                .setAutocomplete(true)
                                .setRequired(true))
                        .addStringOption(option =>
                            option.setName("member")
                                .setDescription("Members you'd like to add")
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName("token_amount")
                                .setDescription("Input the amount of token you'd like to send"))
            )
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const guildId = interaction.guild.id;
        if (interaction.options.getSubcommand() == "project"){
            const updateProjectId = interaction.options.getString("project");
            const userId = interaction.user.id;
            const updateNewsTitle = interaction.options.getString("announcement_title");
            const updateNewsContent = interaction.options.getString("announcement_content");

            let updateContent;
            if (updateNewsContent) updateContent = sprintf("**Title:** %s\n\n**Content:** %s", updateNewsTitle, updateNewsContent);
            else updateContent = sprintf("**Title:** %s", updateNewsTitle);

            await interaction.deferReply({
                ephemeral: true
            })
            
            const isValidProject = validProject(updateProjectId, guildId);

            if (!isValidProject) return interaction.followUp({
                content: "Sorry, we cannot find this project",
                ephemeral: true
            })

            if (!validUser(userId, guildId)) return interaction.followUp({
                content: "Sorry, you don't have access to update this project.",
                ephemeral: true
            })

            const [ projectDetail, projectError ] = await fetchProjectDetail({ projectID: updateProjectId });

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
                        content: "New announcement to this project has been uploaded successfully."
                    })
                }

                return interaction.followUp({
                    content: `New announcement is now live on the project activity feed. DM has been sent to the champion for review.`
                })
            }
        }else{
            const userId = interaction.user.id;
            const [
                projectId,
                teamId,
                roleId,
                membersString,
                tokenAmount
            ] = [
                interaction.options.getString("project"),
                interaction.options.getString("team"),
                interaction.options.getString("role"),
                interaction.options.getString("member").match(/<@.?[0-9]*?>/g),
                interaction.options.getInteger("token_amount")
            ];

            if (!membersString) return interaction.reply({
                content: "Please input at least one member in this guild",
                ephemeral: true
            })
            const projectTitle = validProject(projectId, guildId)?.title;
            if (!projectTitle) return interaction.reply({
                content: "Please input a valid project",
                ephemeral: true
            })

            const teamName = validTeam(teamId, guildId)?.name;
            if (!teamName) return interaction.reply({
                content: "Please input a valid team",
                ephemeral: true
            })

            const roleName = validRole(roleId, guildId)?.name;
            if (!roleName) return interaction.reply({
                content: "Please input a role",
                ephemeral: true
            })

            if (tokenAmount != null && tokenAmount < 1) return interaction.reply({
                content: "Token amount should be larger than 1",
                ephemeral: true
            })

            //TO-DO: Handler Role and other mentions
            const members = membersString.map((value) => {
                let duplicateValue = value;
                if (duplicateValue.startsWith('<@') && duplicateValue.endsWith('>')) {
                    duplicateValue = duplicateValue.slice(2, -1);

                    if (duplicateValue.startsWith('!')) {
                        duplicateValue = duplicateValue.slice(1);
                    }
                    const member = interaction.guild.members.cache.get(duplicateValue);
                    
                    if (member){
                        if (member.user.bot) return null;
                        else return member.id
                    }else return null;
                }
            }).filter(value => value);

            if (members.length == 0) return interaction.reply({
                content: "You need to input at least one member in this guid.",
                ephemeral: true
            })

            const gardenModal = new Modal()
                .setCustomId("garden")
                .setTitle(`Share news to the secret garden!`);

            gardenModal.addComponents(
                new MessageActionRow()
                    .addComponents(
                        new TextInputComponent()
                            .setCustomId("garden_title")
                            .setRequired(true)
                            .setPlaceholder("Enter title here")
                            .setLabel("GARDERN TITLE")
                            .setStyle("SHORT")
                    ),
                new MessageActionRow()
                    .addComponents(
                        new TextInputComponent()
                            .setCustomId("garden_content")
                            .setRequired(true)
                            .setPlaceholder("Enter content here")
                            .setLabel("GARDERN CONTENT")
                            .setStyle("PARAGRAPH")
                    )
            )
            let userCache = {
                projectId: projectId,
                projectTitle: projectTitle,
                memberIds: members,
                teamIds: [teamId],
                teamName: teamName,
                roleIds: [roleId],
                roleName: roleName,
                hasThread: true,
                tokenAmount: null
            };
            if (tokenAmount) userCache.tokenAmount = tokenAmount;
            myCache.set("gardenContext", {
                ...myCache.get("gardenContext"),
                [userId]: userCache
            });
            await interaction.showModal(gardenModal);
            return interaction.followUp({
                content: "Please fill in the form to continue",
                ephemeral: true
            })
        }

    },
    
    async _updateProject(updateInfor){
        const [result, error] = await newTweetProject(updateInfor);

        if (error) return {
            error: true,
            message: error
        }

        return {
            error: false,
            tweetId: result.newTweetID
        }
    }

}