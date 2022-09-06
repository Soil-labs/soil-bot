

const { VoiceState } = require("discord.js");
const { sprintf } = require("sprintf-js");
const { addNewMember } = require("../helper/graphql");
const { awaitWrap, updateUserCache, validUser } = require("../helper/util");

const logger = require("../helper/logger");
const myCache = require("../helper/cache");

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
                    hostId
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

                const current = new Date(new Date().getTime() - timestamp * 1000);
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

                return targetMessage.edit({
                    embeds: embeds,
                    components: voiceChannel.components
                })
                
            }
        }catch(error){
            `User: ${oldState.member.displayName} Guild: ${oldState.guild.name} Error: ${error.name} occurs when voiceStateUpdate. Msg: ${err.message} Stack: ${error.stack}`
        }
        

    }
}