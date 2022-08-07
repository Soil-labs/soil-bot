const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { ChannelType } = require("discord-api-types/payloads/v10");
const { addNewMember } = require('../helper/graphql');
const { sprintf } = require('sprintf-js');
const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");
const _ = require("lodash");


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
                    .setDescription("Manually onboard mulitple members")
                        .addStringOption(option =>
                            option.setName("member")
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
        const subcommand = interaction.options.getSubcommand();

        if (subcommand == "member"){
            const membersString = interaction.options.getString("member").match(/<@.?[0-9]*?>/g);

        //membersString is null
        if (!membersString) return interaction.reply({
            content: "Please input at least one member in this guild",
            ephemeral: true
        })

        let prefix = '';
        let memberIds = [];
        let updatePromise = [];
        let cached = myCache.get("users");
        //TO-DO: Handler Role and other mentions
        membersString.forEach((value) => {
            let duplicateValue = value;
            if (duplicateValue.startsWith('<@') && duplicateValue.endsWith('>')) {
                duplicateValue = duplicateValue.slice(2, -1);

                if (duplicateValue.startsWith('!')) {
                    duplicateValue = duplicateValue.slice(1);
                }

                if (memberIds.includes(duplicateValue)) return;

                const member = interaction.guild.members.cache.get(duplicateValue);

                if (member.user.bot) return
                
                memberIds.push(duplicateValue);
                const index = _.findIndex(cached, (element) => {
                    return element._id == member.id
                })

                const inform = {
                    _id: member.id,
                    discordName: member.user.username,
                    discriminator: member.user.discriminator,
                    discordAvatar: member.user.avatarURL(),
                    invitedBy: interaction.user.id
                }

                if (index == -1) cached.push(inform);
                else cached.splice(index, 1, inform);
                
                updatePromise.push(addNewMember(inform))
                }
            })

            memberIds.forEach((value, index) => {
                if (index == 0){
                    prefix += `?id=${value}`;
                }else{
                    prefix += `&id=${value}`;
                }
            })
            await interaction.deferReply({ ephemeral: true });
            const onboardLink = sprintf(CONSTANT.LINK.STAGING_ONBOARD, prefix);

            await Promise.all(updatePromise);

            const replyEmbed = new MessageEmbed()
                .setTitle("🥰Planting seeds for yourself & others how WAGMI🥰")
                .setDescription(sprintf(CONSTANT.CONTENT.ONBOARD, { onboardLink: onboardLink }));

            myCache.set("users", cached);

            return interaction.followUp({
                embeds: [replyEmbed]
            })
        }

        if (subcommand == "auto"){
            const voiceChannel = interaction.options.getChannel("channel");
            const members = voiceChannel.members;
            if (myCache.has("voiceContext")){
                const context = myCache.get("voiceContext");
                if (context){
                    return interaction.reply({
                        content: `Sorry, an onboarding call has started in <#${context.channelId}> at <t:${Math.floor(context.timestamp / 1000)}:f>`,
                        components: [
                            new MessageActionRow()
                                .addComponents([
                                    new MessageButton()
                                        .setLabel("Jump to its board")
                                        .setStyle("LINK")
                                        .setURL(sprintf(CONSTANT.LINK.DISCORD_MSG, {
                                            guildId: interaction.guild.id,
                                            channelId: context.channelId,
                                            messageId: context.messageId
                                        }))
                                ])
                        ],
                        ephemeral: true
                    })
                }
            }

            let membersFields = '';
            
            for (const memberId of members.keys()){
                membersFields += `\`00:00:00\` <@${memberId}>\n`
            }
            if (membersFields == '') membersFields = '-';
            const timestampMili = new Date().getTime();
            const timestampSec = Math.floor(timestampMili / 1000);
            const message = await voiceChannel.send({
                embeds: [
                    new MessageEmbed()
                        .setTitle(`${voiceChannel.name} Statistics Started`)
                        .setAuthor({ name: `${interaction.user.tag}`, iconURL: interaction.user.avatarURL() })
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
                                .setEmoji("🫂")
                        ])
                ]
            });

            myCache.set("voiceContext", {
                messageId: message.id,
                channelId: voiceChannel.id,
                timestamp: timestampMili
            })

            return interaction.reply({
                content: `Auto onboarding has started in <#${voiceChannel.id}>`,
                ephemeral: true
            })
        
        }

    }

}