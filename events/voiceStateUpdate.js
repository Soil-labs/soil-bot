

const { VoiceState, MessageEmbed } = require("discord.js");
const { sprintf } = require("sprintf-js");
const { addNewMember } = require("../helper/graphql");
const { awaitWrap, updateUserCache, validUser, checkChannelSendPermission } = require("../helper/util");

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
                    messageLink,
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
                        updateUserCache(member.id, member.username, guildId);
                    }
                }

                const voiceChannel = newState.channel;
                const {targetMessage, error} = await awaitWrap(voiceChannel.messages.fetch(messageId), "targetMessage");
                //to-do find a way to resume or some method to handle deleted message, fetch from audio log? maybe
                if (error) return logger.warn(`Cannot fectch message in ${voiceChannel.name} when voiceStateUpdate`);

                let embeds = targetMessage.embeds;
                let membersFields = embeds[0].fields[0].value;

                const difference = new Date().getTime() - timestamp * 1000;
                const current = new Date(difference);
                const hour = ("00" + current.getHours().toString()).slice(-2);
                const minute = ("00" + current.getMinutes().toString()).slice(-2);
                const sec = ("00" + current.getSeconds().toString()).slice(-2);
                //to-do overflow the embed: Too many members joined
                membersFields += sprintf("\n\`%s:%s:%s\` <@%s> joined this onboarding call.", hour, minute, sec, newState.member.id);
                embeds[0].fields = [
                    {
                        name: "Activity",
                        value: membersFields
                    }
                ];
                myCache.set("voiceContext", {
                    ...contexts,
                    [guildId]: {
                        ...guildContext,
                        attendees: [...attendees, newMemberId]
                    }
                })

                targetMessage.edit({
                    embeds: embeds,
                    components: voiceChannel.components
                });

                if (Math.floor(difference / 1000) > CONSTANT.NUMERICAL_VALUE.ONBOARD_REPEAT_CONTEXT){
                    if (checkChannelSendPermission(voiceChannel, newState.guild.me.id)){
                        const roomLink = sprintf(CONSTANT.LINK.ROOM, {
                            roomId: roomId,
                            userId: newMemberId
                        })

                        return voiceChannel.send({
                            content: `Welcome, <@${newMemberId}>`,
                            embeds: [
                                new MessageEmbed()
                                    .setTitle("Join the Party🎊")
                                    .setDescription(sprintf("Hey <@%s>! I'm an Eden 🌳 bot helping <@%s> with this onboarding call! Click [here](<%s>) to claim a ticket and join the onboarding Party Page! Or you can jump to our [onboarding dashboard](%s)",
                                        newMemberId, hostId, roomLink, messageLink))
                            ]
                        })
                    }
                }
                return;
            }
        }catch(error){
            `User: ${newState.member.displayName} Guild: ${newState.guild.name} Error: ${error.name} occurs when voiceStateUpdate. Msg: ${error.message} Stack: ${error.stack}`
        }
        

    }
}