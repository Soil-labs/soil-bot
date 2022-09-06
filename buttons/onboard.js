const { ButtonInteraction, MessageEmbed, MessageActionRow, MessageButton} = require("discord.js");
const { sprintf } = require("sprintf-js");

const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");

module.exports = {
    customId: ["onboard", "end"],
    /**
     * @param  {ButtonInteraction} interaction
     */
    async execute(interaction){ 
        if (!myCache.has("voiceContext")) return interaction.reply({
            content: "Please try again later, auto onboarding is initing",
            ephemeral: true
        })

        const guildId = interaction.guild.id;
        const contexts = myCache.get("voiceContext");
        const guildVoiceContext = contexts[guildId];
        if (!guildVoiceContext || Object.keys(guildVoiceContext).length == 0) return interaction.reply({
            content: "Cannot find this auto onboarding, please start a new one.",
            ephemeral: true
        });
        // <t:${timestampSec}:f>
        const { hostId, roomId, timestamp } = guildVoiceContext;
        let [ startTimeStamp ] = interaction.message.embeds[0].description.match(/<t:\d*:f>/);
        if (startTimeStamp.slice(3, -3) !== timestamp.toString()) return interaction.reply({
            content: "Cannot find this auto onboarding, please start a new one.",
            ephemeral: true
        });
         
        if (interaction.customId == this.customId[0]){
            const attendees = guildVoiceContext.attendees;

            if (!attendees.includes(interaction.user.id)) return interaction.reply({
                content: "Sorry, you did not join in this onboarding call.",
                ephemeral: true
            })
            await interaction.deferReply({ ephemeral: true });

            const member = interaction.user;

            const roomLink = sprintf(CONSTANT.LINK.ROOM, {
                roomId: roomId,
                userId: member.id
            })
            
            return interaction.followUp({
                // components: [
                //     new MessageActionRow()
                //         .addComponents([
                //             new MessageButton()
                //                 .setLabel("Join the Party")
                //                 .setStyle("LINK")
                //                 .setURL(roomLink)
                //                 .setEmoji("🎊")
                //         ])
                // ],
                embeds: [
                    new MessageEmbed()
                        .setTitle("Join the Party🎊")
                        .setDescription(sprintf("Hey <@%s>! I'm an Eden 🌳 bot helping <@%s> with this onboarding call! Click [here](<%s>) to claim a ticket and join the onboarding Party Page!",
                            interaction.user.id, hostId, roomLink))
                ]
            })
        }

        if (interaction.customId == this.customId[1]){
            if (interaction.user.id != hostId) return interaction.reply({
                content: "Sorry, only the host is allowed to trigger this button",
                ephemeral: true
            })

            const message = interaction.message;
            let button = message.components;
            button[0].components[0].disabled = true;
            button[0].components[1].disabled = true;

            let embeds = message.embeds;
            const title = `${interaction.guild.name} Onboarding Call Ended`;
            
            embeds[0].setTitle(title);

            await message.edit({
                embeds: embeds,
                components: button
            });

            myCache.set("voiceContext", {
                ...contexts,
                [guildId]: {}
            });

            return interaction.reply({
                content: "You have cancelled this auto onboarding",
                ephemeral: true
            })
        }
    }
   
}