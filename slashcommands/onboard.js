const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
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
                    invitedBy: interaction.user.id,
                    serverId: [interaction.guild.id]
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

}