const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { addNewMember } = require('../helper/graphql');
const { sprintf } = require('sprintf-js');
const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");
const { updateUserCache, awaitWrap } = require('../helper/util');


module.exports = {
    commandName: "onboard",
    description: "Find & be found for opportunity",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addStringOption(option =>
                option.setName("member")
                    .setDescription("Member you'd like to onboard")
                    .setRequired(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const membersString = interaction.options.getString("member").match(/<@.?[0-9]*?>/g);
        const guildId = interaction.guild.id;
        //membersString is null
        if (!membersString) return interaction.reply({
            content: "Please input at least one member in this guild",
            ephemeral: true
        })

        let prefix = '';
        let memberIds = [];
        let updatePromise = [];
        let toBecached = [];
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

        //updateCache
        //to-do should support array updates cache
        toBecached.forEach((value) => {
            updateUserCache(value.id, value.discordName, guildId)
        })

        const replyEmbed = new MessageEmbed()
            .setTitle("🥰Planting seeds for yourself & others how WAGMI🥰")
            .setDescription(sprintf(CONSTANT.CONTENT.ONBOARD, { onboardLink: onboardLink }));

        return interaction.followUp({
            embeds: [replyEmbed]
        })

    }

}