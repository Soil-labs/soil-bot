const { ButtonInteraction, MessageEmbed} = require("discord.js");
const { addNewMember } = require("../helper/graphql");
const { awaitWrap, updateUsersCache } = require("../helper/util");
const { sprintf } = require("sprintf-js");

const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");

module.exports = {
    customId: ["onboard", "cancel"],
    /**
     * @param  {ButtonInteraction} interaction
     */
    async execute(interaction){ 
        if (!myCache.has("voiceContext")) return interaction.reply({
            content: "Please try again, auto onboarding is initing",
            ephemeral: true
        })

        const guildId = interaction.guild.id;
        const contexts = myCache.get("voiceContext");
        const guildVoiceContext = contexts[guildId];
        if (!guildVoiceContext || Object.keys(guildVoiceContext).length == 0) return interaction.reply({
            content: "Error occurs on auto onboarding, please call admin teams",
            ephemeral: true
        }) 

        const hostId = guildVoiceContext.hostId;
        if (interaction.user.id != hostId) return interaction.reply({
            content: "Sorry, only the host is allowed to trigger this button",
            ephemeral: true
        })

        const message = interaction.message;
        let button = message.components;
        button[0].components[0].disabled = true;
        button[0].components[1].disabled = true;

        let embeds = message.embeds;
        const title = interaction.customId == this.customId[0] 
            ? `${interaction.guild.name} Onboarding Call Ended` : `${interaction.guild.name} Onboarding Call Cancelled`;
        
        embeds[0].setTitle(title);

        await message.edit({
            embeds: embeds,
            components: button
        });

        if (interaction.customId == this.customId[0]){
            const attendees = guildVoiceContext.attendees;
            if (attendees.length == 0) return interaction.reply({
                content: "No one attended today's onboarding call",
                ephemeral: true
            })

            await interaction.deferReply({ ephemeral: true });
            const guildMemberManager = interaction.guild.members;

            let updatePromise = [];
            let toBecached = [];
            let prefix = '';
            let counter = 0;
            for (const attendeeId of attendees){
                let member = guildMemberManager.cache.get(attendeeId);
                if (!member) {
                    const {result, error} = await awaitWrap(guildMemberManager.fetch());
                    if (error) continue;
                    else member = result;
                }
                const inform = {
                    _id: attendeeId,
                    discordName: member.user.username,
                    discriminator: member.user.discriminator,
                    discordAvatar: member.user.avatarURL(),
                    invitedBy: hostId,
                    serverId: guildId
                }
                toBecached.push({
                    id: attendeeId,
                    discordName: inform.discordName
                });
                updatePromise.push(addNewMember(inform));

                if (counter == 0) {
                    prefix += `?id=${attendeeId}`;
                }else{
                    prefix += `&id=${attendeeId}`;
                }
                counter++;
            }

            const onboardLink = sprintf(CONSTANT.LINK.STAGING_ONBOARD, prefix);

            const results = await Promise.all(updatePromise);

            if (results.filter((value) => (value[1])).length != 0){
                button[0].components[0].disabled = false;
                button[0].components[1].disabled = false;
                await message.edit({
                    embeds: embeds,
                    components: button
                });
                return interaction.followUp({
                    content: "Error occured when updating members."
                })
            } 

            updateUsersCache(toBecached);
            myCache.set("voiceContext", {
                ...contexts,
                [guildId]: {}
            });

            const replyEmbed = new MessageEmbed()
                .setTitle("🥰Planting seeds for yourself & others how WAGMI🥰")
                .setDescription(sprintf(CONSTANT.CONTENT.ONBOARD, { onboardLink: onboardLink }));
            
            return interaction.followUp({
                embeds: [replyEmbed]
            })
        }

        if (interaction.customId == this.customId[1]){
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