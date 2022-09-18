

const { VoiceState, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { sprintf } = require("sprintf-js");
const { addNewMember, findRoom } = require("../helper/graphql");
const { awaitWrap, updateUserCache, validUser, checkChannelSendPermission, convertMsToTime, checkMessageModerate } = require("../helper/util");

const logger = require("../helper/logger");
const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");

module.exports = {
    name: "voiceStateUpdate",
    once: false,
    /**
     * @param  { VoiceState } oldState
     * @param  { VoiceState } newState
     */
    async execute(oldState, newState) {
        if (newState.member.user.bot) return;
        if (!myCache.has("voiceContext")) return;
        try{
            const guildId = oldState.guild.id;
            const contexts = myCache.get("voiceContext");
            const guildContext = contexts[guildId];
            if (!guildContext || Object.keys(guildContext).length == 0) return;

            const targetVoiceChannelId = guildContext.channelId;

            if (oldState?.channel?.id != targetVoiceChannelId && newState?.channel?.id == targetVoiceChannelId){
                const {
                    messageId,
                    timestamp,
                    attendees,
                    hostId,
                    roomId
                } = guildContext;
                const newMemberId = newState.member.id;
                if (attendees.includes(newMemberId)) return;

                if (!validUser(newMemberId, guildId)){
                    const [ result, graphQLError ] = await addNewMember({
                        _id: newMemberId,
                        discordName: newState.member.displayName,
                        discriminator: newState.member.user.discriminator,
                        discordAvatar: newState.member.user.avatarURL(),
                        invitedBy: hostId,
                        serverId: guildId
                    });
                    // to-do handle the case that the user fail to be onboarded
                    if (result) {
                        updateUserCache(newMemberId, newState.member.user.username, guildId);
                    }
                }

                const voiceChannel = newState.channel;
                const {targetMessage, error} = await awaitWrap(voiceChannel.messages.fetch(messageId), "targetMessage");
                //to-do find a way to resume or some method to handle deleted message, fetch from audio log? maybe
                if (error) return logger.warn(`Cannot fectch message in ${voiceChannel.name} when voiceStateUpdate`);

                let embeds = targetMessage.embeds;

                const difference = new Date().getTime() - timestamp * 1000;
                //to-do overflow the embed: Too many members joined
                embeds[0].description += sprintf("\n\`%s\` <@%s> joined this onboarding call.", convertMsToTime(difference), newState.member.id);

                myCache.set("voiceContext", {
                    ...contexts,
                    [guildId]: {
                        ...guildContext,
                        attendees: [...attendees, newMemberId]
                    }
                })
                targetMessage.edit({
                    embeds: embeds,
                    components: targetMessage.components
                });
                
                if (Math.floor(difference / 1000) >= CONSTANT.NUMERICAL_VALUE.ONBOARD_REPEAT_CONTEXT){
                    if (checkChannelSendPermission(voiceChannel, newState.guild.me.id)){
                        const roomLink = sprintf(CONSTANT.LINK.ROOM, {
                            roomId: roomId,
                        })
                        const deleteInMin = Math.floor(new Date().getTime() / 1000) + Number(CONSTANT.NUMERICAL_VALUE.ONBOARD_AUTO_DELETE);
                        const msg = await voiceChannel.send({
                            content: `Welcome, <@${newMemberId}>`,
                            embeds: [
                                new MessageEmbed()
                                    .setTitle("Join the Party🎊")
                                    .setDescription(sprintf("Hey! I'm an Eden 🌳 bot helping <@%s> with this onboarding call! Click [here](<%s>) to claim a ticket and join the onboarding Party Page! Please note that this meesage will be deleted <t:%s:R>",
                                        hostId, roomLink, deleteInMin))
                            ],
                            components: [
                                new MessageActionRow()
                                    .addComponents([
                                        new MessageButton()
                                            .setStyle('LINK')
                                            .setURL(roomLink)
                                            .setLabel('Get Party Ticket')
                                            .setEmoji("🎟️")
                                    ])
                            ]
                        });
                        setTimeout(async() => {
                            if (msg.deletable){
                                msg.delete();
                            }
                            const [result, error] = await findRoom({
                                roomId: roomId
                            });
                            if (error) return;
                            const filtered = result.members.filter((value) => value._id == newMemberId);
                            if (filtered.length == 0){
                                const dmChannel = await newState.member.createDM();
                                return awaitWrap(dmChannel.send({
                                    embeds: [
                                        new MessageEmbed()
                                            .setTitle("Join the Party🎊")
                                            .setDescription(sprintf("Hey! I'm an Eden 🌳 bot helping <@%s> with this onboarding call! Click [here](<%s>) to claim a ticket and join the onboarding Party Page!",
                                                hostId, roomLink))
                                    ],
                                    components: [
                                        new MessageActionRow()
                                            .addComponents([
                                                new MessageButton()
                                                    .setStyle('LINK')
                                                    .setURL(roomLink)
                                                    .setLabel('Get Party Ticket')
                                                    .setEmoji("🎟️")
                                            ])
                                    ]
                                }));
                            }
                        }, Number(CONSTANT.NUMERICAL_VALUE.ONBOARD_AUTO_DELETE) * 1000);
                    }
                }
                return;
            }else return;
        }catch(error){
            console.log(`User: ${newState?.member?.displayName} Guild: ${newState?.guild?.name} Error: ${error?.name} occurs when voiceStateUpdate. Msg: ${error?.message} Stack: ${error?.stack}`)
        }
        

    }
}