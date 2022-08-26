

const { VoiceState } = require("discord.js");
const { sprintf } = require("sprintf-js");
const myCache = require("../helper/cache");
const logger = require("../helper/logger");
const { awaitWrap } = require("../helper/util");

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

        const guildId = oldState.guild.id;
        const contexts = myCache.get("voiceContext");
        const guildContext = contexts[guildId];
        if (!guildContext || Object.keys(guildContext).length == 0) return;

        const targetVoiceChannelId = guildContext.channelId;

        if (oldState?.channel?.id != targetVoiceChannelId && newState?.channel?.id == targetVoiceChannelId){
            const {
                messageId,
                timestamp,
                attendees
            } = guildContext;
            const newMemberId = newState.member.id;
            if (attendees.includes(newMemberId)) return;

            const voiceChannel = newState.channel;
            const {targetMessage, error} = await awaitWrap(voiceChannel.messages.fetch(messageId), "targetMessage");
            //to-do find a way to resume or some method to handle deleted message, fetch from audio log? maybe
            if (error) return logger.warn(`Cannot fectch message in ${voiceChannel.name} when voiceStateUpdate`);

            let embeds = targetMessage.embeds;
            let membersFields = embeds[0].fields[0].value;

            const current = new Date(new Date().getTime() - timestamp);
            const hour = ("00" + current.getHours().toString()).slice(-2);
            const minute = ("00" + current.getMinutes().toString()).slice(-2);
            const sec = ("00" + current.getSeconds().toString()).slice(-2);
            //to-do overflow for the embed
            if (membersFields == '-') membersFields = '';
            membersFields += sprintf("\n\`%s:%s:%s\` <@%s>", hour, minute, sec, newState.member.id);
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

    }
}