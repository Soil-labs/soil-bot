const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { validUser, updateUserCache } = require('../helper/util');
const { addNewMember, updateUser } = require('../helper/graphql');
const { sprintf } = require('sprintf-js');
const CONSTANT = require("../helper/const");
const _ = require("lodash");


module.exports = {
    commandName: "signup",
    description: "Onboard yourself",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const user = interaction.user;
        const guildId = interaction.guild.id;
        const validResult = validUser(user.id, guildId);

        const inform = {
            _id: user.id,
            discordName: user.username,
            discriminator: user.discriminator,
            discordAvatar: user.displayAvatarURL()
        };
        await interaction.followUp({ ephemeral: true });
        if (validResult){
            const [result, error] = await updateUser(inform);

            if (error) return interaction.followUp({
                content: `Error occured when onboarding yourself: \`${error}\``,
            });
        }else{ 
            const [result, error] = await addNewMember({
                ...inform,
                invitedBy: user.id,
                serverId: [guildId]
            });
            
            if (error) return interaction.followUp({
                content: `Error occured when onboarding yourself: \`${error}\``,
            });
        }

        updateUserCache(user.id, user.username, guildId);

        const onboardLink = sprintf(CONSTANT.LINK.AIRTABLE_ONBOARDING, {
            discordName: encodeURIComponent(user.username),
            discordId: user.id
        })

        const replyEmbed = new MessageEmbed()
            .setTitle("Join Soil 🌳 ")
            .setDescription(sprintf(CONSTANT.CONTENT.ONBOARD_SELF, { onboardLink: onboardLink }));

        return interaction.followUp({
            embeds: [replyEmbed],
        })

    }

}