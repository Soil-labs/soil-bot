const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { addNewMember, createRoom } = require('../helper/graphql');
const { sprintf } = require('sprintf-js');
const { ChannelType, PermissionFlagsBits } = require("discord-api-types/payloads/v10");
const { updateUsersCache, awaitWrap, checkChannelSendPermission } = require('../helper/util');
const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");
const _ = require("lodash")


module.exports = {
    commandName: "onboard",
    description: "Find & be found for opportunity",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addSubcommand(command =>
                command.setName("member")
                    .setDescription("Onboard multiple new frens into Eden 🌳")
                        .addStringOption(option =>
                            option.setName("frens")
                                .setDescription("Member you'd like to onboard")
                                .setRequired(true))
            )
            .addSubcommand(command =>
                command.setName("auto")
                    .setDescription("Automatically onboard members in a voice call")
                        .addChannelOption(option =>
                            option.setName("channel")
                                .setDescription("Onboarding voice channel")
                                .addChannelTypes(ChannelType.GuildVoice)
                                .setRequired(true))
            )
            .addSubcommand(command =>
                command.setName("room")
                    .setDescription("Set up a channel to self-onboard.")
                        .addChannelOption(option =>
                            option.setName("channel")
                                .setDescription("Choose a channel")
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true))
            )

    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        if (subCommand == "member"){
            const membersString = interaction.options.getString("frens").match(/<@.?[0-9]*?>/g);
            //membersString is null
            if (!membersString) return interaction.reply({
                content: "Please input at least one member in this guild",
                ephemeral: true
            })

            let prefix = '';
            let memberIds = [];
            let updatePromise = [];
            let toBecached = [];

            membersString.forEach((value) => {
                let duplicateValue = value;
                if (duplicateValue.startsWith('<@') && duplicateValue.endsWith('>')) {
                    duplicateValue = duplicateValue.slice(2, -1);

                    if (duplicateValue.startsWith('!')) {
                        duplicateValue = duplicateValue.slice(1);
                    }

                    if (memberIds.includes(duplicateValue)) return;

                    const member = interaction.guild.members.cache.get(duplicateValue);

                    //to-do, should fetch it again, here prevents unfetchable members and role mention and other mentions and bot
                    if (member){
                        if (member.user.bot) return;
                    }else return;
                    
                    memberIds.push(duplicateValue);

                    const inform = {
                        _id: member.id,
                        discordName: member.user.username,
                        discriminator: member.user.discriminator,
                        discordAvatar: member.user.avatarURL(),
                        invitedBy: interaction.user.id,
                        serverId: guildId
                    }
                    toBecached.push({
                        id: duplicateValue,
                        discordName: inform.discordName
                    });

                    updatePromise.push(addNewMember(inform));
                }
            })
            if (memberIds.length == 0) return interaction.reply({
                content: "You need to input at least one member in this guid.",
                ephemeral: true
            });

            memberIds.forEach((value, index) => {
                if (index == 0){
                    prefix += `?id=${value}`;
                }else{
                    prefix += `&id=${value}`;
                }
            })
            await interaction.deferReply({ ephemeral: true });
            const onboardLink = sprintf(CONSTANT.LINK.STAGING_ONBOARD, prefix);

            const results = await Promise.all(updatePromise);

            if (results.filter((value) => (value[1])).length != 0) return interaction.followUp({
                content: "Error occured when updating members."
            })

            updateUsersCache(toBecached, guildId);
            let embedTitle, embedDescription;
            if (memberIds.length == 1 && memberIds[0] == interaction.user.id){
                embedTitle = "Hooray! You're about to join Eden 🌳";
                embedDescription = sprintf(CONSTANT.CONTENT.ONBOARD_SELF, { onboardLink: CONSTANT.LINK.SIGNUP});
            }else{
                embedTitle = "You're about to onboard new members 🌳";
                embedDescription = sprintf(CONSTANT.CONTENT.GROUP_ONBORAD, { onboardLink: onboardLink });
            }

            return interaction.followUp({
                embeds: [
                    new MessageEmbed()
                        .setTitle(embedTitle)
                        .setDescription(embedDescription)
                ]
            })
        }

        if (subCommand == "auto"){
            if (!myCache.has("voiceContext")) return interaction.reply({
                content: "Please try again, auto onboard is initing.",
                ephemeral: true
            })

            const hostId = interaction.user.id;
            const voiceChannel = interaction.options.getChannel("channel");
            const selectedMembers = voiceChannel.members.filter((member) => !member.user.bot).map((_, memberId) => (memberId));

            const contexts = myCache.get("voiceContext");
            const guildVoiceContext = contexts[guildId];
            //Onboarding is going on
            if (guildVoiceContext && Object.keys(guildVoiceContext).length != 0){
                return interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setTitle("Onboarding Call is going on")
                            .setDescription(`Sorry, an onboarding call has started in <#${guildVoiceContext.channelId}>, hosted by <@${guildVoiceContext.hostId}>, at <t:${guildVoiceContext.timestamp}:f>.\nPlease wait for its end or cancel it through its dashboard.`)
                    ],
                    components: [
                        new MessageActionRow()
                            .addComponents([
                                new MessageButton()
                                    .setLabel("Jump to the Dashboard")
                                    .setStyle("LINK")
                                    .setURL(guildVoiceContext.messageLink)
                            ])
                    ],
                    ephemeral: true
                })
            }
            await interaction.deferReply({ephemeral: true});
            const [result, error] = await createRoom();
            if (error) return interaction.followUp({
                content: `Error occured when creating room: \`${error}\``
            })

            let membersFields = `\`00:00:00\` <@${hostId}> started this onboarding call.\n`;
            for (const memberId of selectedMembers){
                if (memberId != hostId){
                    membersFields += `\`00:00:00\` <@${memberId}> joined this onboarding call.\n`;
                }
            }

            const timestampSec = Math.floor(new Date().getTime() / 1000);
            if (!checkChannelSendPermission(voiceChannel, interaction.guild.me.id)){
                return interaction.followUp({
                    content: "Permission denied, please check whether the bot is allowed to send message in this channel",
                })
            }
            const message= await voiceChannel.send({
                embeds: [
                    new MessageEmbed()
                        .setAuthor({ name: `Onboarding Call Host - ${interaction.user.username}`, iconURL: interaction.user.avatarURL() })
                        .setDescription(`**Started**: <t:${timestampSec}:f>(<t:${timestampSec}:R>)`)
                        .addField("Attendees", membersFields)
                ],
                components: [
                    new MessageActionRow()
                        .addComponents([
                            new MessageButton()
                                .setStyle("LINK")
                                .setLabel("Get Party Ticket")
                                .setURL(sprintf(CONSTANT.LINK.ROOM, {
                                    roomId: result._id,
                                }))
                                .setEmoji("🎟️"),
                            new MessageButton()
                                .setCustomId("end")
                                .setStyle('SECONDARY')
                                .setLabel("End Party")
                        ])
                ]
            });

            const msgLink = sprintf(CONSTANT.LINK.DISCORD_MSG, {
                guildId: guildId,
                channelId: voiceChannel.id,
                messageId: message.id
            });

            myCache.set("voiceContext", {
                ...myCache.get("voiceContext"),
                [guildId]: {
                    messageId: message.id,
                    messageLink: msgLink,
                    channelId: voiceChannel.id,
                    timestamp: timestampSec,
                    hostId: hostId,
                    attendees: _.uniq([...selectedMembers, hostId]),
                    roomId: result._id
                }
            })

            return interaction.followUp({
                content: `Auto onboarding has started in <#${voiceChannel.id}>`,
                ephemeral: true,
                components: [
                    new MessageActionRow()
                        .addComponents([
                            new MessageButton()
                                .setStyle("LINK")
                                .setLabel("Jump to the dashboard")
                                .setEmoji("🔗")
                                .setURL(msgLink)
                        ])
                ]
            })
        }

        if (subCommand == "room"){
            const targetChannel = interaction.options.getChannel("channel");
            if (!targetChannel.viewable) return interaction.reply({
                content: "Sorry, this channel is unviewable for me",
                ephemeral: true
            })

            if(!targetChannel.permissionsFor(interaction.guild.me).has(PermissionFlagsBits.SendMessages)) return interaction.reply({
                content: "Sorry, I cannot send message to this channel",
                ephemeral: true
            })

            targetChannel.send({
                embeds: [
                    new MessageEmbed()
                        .setTitle("Onboard")
                        .setDescription("Are you a person looking to join a project, or project looking for a person?")
                ],
                components: [
                    new MessageActionRow()
                        .addComponents([
                            new MessageButton()
                                .setLabel("Project")
                                .setCustomId("project")
                                .setEmoji("🛠️")
                                .setStyle("PRIMARY"),
                            new MessageButton()
                                .setLabel("Talent")
                                .setCustomId("talent")
                                .setEmoji("🧙")
                                .setStyle("SECONDARY")
                        ])
                ]
            })
            
            return interaction.reply({
                content: `Message has been sent to <#${targetChannel.id}>`,
                ephemeral: true
            })
        }

    }

}