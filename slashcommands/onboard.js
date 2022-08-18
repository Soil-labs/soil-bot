const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { addNewMember } = require('../helper/graphql');
const { sprintf } = require('sprintf-js');
const { ChannelType } = require("discord-api-types/payloads/v10");
const { updateUsersCache, awaitWrap } = require('../helper/util');
const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");


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
                    if (member?.user?.bot) return;
                    
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
                embedTitle = "You’re about to onboard new members 🌳";
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
                            .setDescription(`Sorry, an onboarding call has started in <#${guildVoiceContext.channelId}>, hosted by <@${guildVoiceContext.hostId}>, at <t:${Math.floor(guildVoiceContext.timestamp / 1000)}:f>.\nPlease wait for its end or cancel it through its dashboard.`)
                    ],
                    components: [
                        new MessageActionRow()
                            .addComponents([
                                new MessageButton()
                                    .setLabel("Jump to the Dashboard")
                                    .setStyle("LINK")
                                    .setURL(sprintf(CONSTANT.LINK.DISCORD_MSG, {
                                        guildId: guildId,
                                        channelId: guildVoiceContext.channelId,
                                        messageId: guildVoiceContext.messageId
                                    }))
                            ])
                    ],
                    ephemeral: true
                })
            }

            let membersFields = '';
            if (selectedMembers.length == 0 ) membersFields = '-';
            else {
                for (const memberId of selectedMembers){
                    membersFields += `\`00:00:00\` <@${memberId}>\n`
                }
            }
            const timestampMili = new Date().getTime();
            const timestampSec = Math.floor(timestampMili / 1000);
            
            const { message, msgError } = await awaitWrap(voiceChannel.send({
                embeds: [
                    new MessageEmbed()
                        .setTitle(`${interaction.guild.name} Onboarding Call Started`)
                        .setAuthor({ name: `@${interaction.user.tag} -- Onboarding Call Host`, iconURL: interaction.user.avatarURL() })
                        .setDescription(`**ChannelID**: <#${voiceChannel.id}>\n\n**Started**: <t:${timestampSec}:f>(<t:${timestampSec}:R>)`)
                        .addField("Avtivity", membersFields)
                ],
                components: [
                    new MessageActionRow()
                        .addComponents([
                            new MessageButton()
                                .setCustomId("onboard")
                                .setStyle("PRIMARY")
                                .setLabel("Onboard Crew")
                                .setEmoji("🫂"),
                            new MessageButton()
                                .setCustomId("cancel")
                                .setStyle("DANGER")
                                .setLabel("Cancel Onboarding")
                                .setEmoji("⚠️"),
                        ])
                ]
            }), "message", "msgError");

            if (msgError){
                return interaction.reply({
                    content: "Permission denied, please check whether the bot is allowed to send message in this channel",
                    ephemeral: true
                })
            }

            myCache.set("voiceContext", {
                ...myCache.get("voiceContext"),
                [guildId]: {
                    messageId: message.id,
                    channelId: voiceChannel.id,
                    timestamp: timestampMili,
                    hostId: interaction.user.id,
                    attendees: selectedMembers
                }
            })

            return interaction.reply({
                content: `Auto onboarding has started in <#${voiceChannel.id}>`,
                ephemeral: true
            })
        }

    }

}