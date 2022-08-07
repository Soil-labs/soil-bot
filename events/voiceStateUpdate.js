const { VoiceState } = require("discord.js");
const { sprintf } = require("sprintf-js");
const myCache = require("../helper/cache");
const logger = require("../helper/logger");

module.exports = {
    name: "voiceStateUpdate",
    once: false,
    /**
     * @param  { VoiceState } oldState
     * @param  { VoiceState } newState
     */
    async execute(oldState, newState) {
        console.log(oldState?.channel?.type, "=>", newState?.channel?.type);
        //todo handle from one voice => current voice
        //|| (oldState?.channel?.type == "GUILD_VOICE" && newState?.channel?.type == "GUILD_VOICE")
        if (
            (!oldState.channel && newState?.channel?.type == "GUILD_VOICE")
        ){
            if (myCache.has("voiceContext")){
                const voiceContext = myCache.get("voiceContext");
                if (!voiceContext) return;

                const {
                    channelId,
                    messageId,
                    timestamp
                } = voiceContext;

                const targetChannel = newState.guild.channels.cache.get(channelId);
                const targetMessage = await targetChannel.messages.fetch(messageId);

                let embeds = targetMessage.embeds;
                let membersFields = embeds[0].fields[0].value;
                if (membersFields.includes(newState.member.id)) return;

                const current = new Date(new Date().getTime() - timestamp);
                const hour = ("00" + current.getHours().toString()).slice(-2);
                const minute = ("00" + current.getMinutes().toString()).slice(-2);
                const sec = ("00" + current.getSeconds().toString()).slice(-2);
                if (membersFields == '-') membersFields = '';
                membersFields += sprintf("\n\`%s:%s:%s\` <@%s>", hour, minute, sec, newState.member.id);
                embeds[0].fields = [
                    {
                        name: "Activity",
                        value: membersFields
                    }
                ];

                return targetMessage.edit({
                    embeds: embeds,
                    components: targetChannel.components
                })
            }
        }

    }
}