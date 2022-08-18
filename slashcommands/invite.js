const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { addNewMember } = require("../helper/graphql");
const { validUser, awaitWrap, updateUserCache } = require('../helper/util');
const { sprintf } = require('sprintf-js');
const CONSTANT = require("../helper/const");


module.exports = {
    commandName: "invite",
    description: "Invite a fren to join Eden 🌳",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addUserOption(option =>
                option.setName("fren")
                    .setDescription("The member you'd like to support")
                    .setRequired(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const invitee = interaction.options.getUser('fren');
        const inviter = interaction.user;
        const guildId = interaction.guild.id;
        
        // if (invitee.id == inviter.id) return interaction.reply({
        //     content: "Sorry, you cannot invite yourself.",
        //     ephemeral: true
        // })

        if (invitee.bot) return interaction.reply({
            content: "Sorry, you cannot choose a bot as a target.",
            ephemeral: true
        })

        const isNewInviter = validUser(inviter.id, guildId);
        if (!isNewInviter) {
            const inviterInform = {
                _id: inviter.id,
                discordName: inviter.username,
                discriminator: inviter.discriminator,
                discordAvatar: inviter.displayAvatarURL({ format: 'jpg' }),
                invitedBy: inviter.id,
                serverId: guildId
            };

            await interaction.deferReply({
                ephemeral: true
            })
            const [inviterResult, inviterError] = await addNewMember(inviterInform);

            if (inviterError) return interaction.followUp({
                content: `Error occured when onboarding you: \`${error}\``
            })

            updateUserCache(inviter.id, inviter.username, guildId);
        }
        //to-do handle invite myself in a smarter way, just return a dm or a reply
        // if (invitee.id == inviter.id) return;

        const inviteeInform = {
            _id: invitee.id,
            discordName: invitee.username,
            discriminator: invitee.discriminator,
            discordAvatar: invitee.displayAvatarURL({ format: 'jpg' }),
            invitedBy: inviter.id,
            serverId: guildId
        }
        if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

        const [result, error] = await addNewMember(inviteeInform);

        if (error) return interaction.followUp({
            content: `Error occured: \`${error}\``
        })

        updateUserCache(invitee.id, invitee.username, guildId);

        let embedContent = new MessageEmbed().setTitle("You've been invited to join Eden 🌳");
        if (process.env.SLASH_CMD_ENV == "production" && process.env.DM_OPTION == "false"){
            interaction.channel.send({
                content: `<@${inviter.id}> has invited <@${invitee.id}> to join Eden 🌳! BIG WAGMI ENERGY!⚡`,
                embeds: [
                    embedContent.setDescription(sprintf(CONSTANT.CONTENT.INVITE_DM_FAIL, {
                        onboardLink: CONSTANT.LINK.SIGNUP,
                        inviteeId: invitee.id
                    }))
                ]
            })
            return interaction.followUp({
                content: sprintf("Invite message has been sent to <#%s>", interaction.channel.id)
            })
        }
        const DMchannel = await invitee.createDM();
        const { DMResult, DMError } = await awaitWrap(DMchannel.send({
            embeds: [
                embedContent.setDescription(sprintf(CONSTANT.CONTENT.INVITE_DM, {
                    onboardLink: CONSTANT.LINK.SIGNUP,
                    inviterId: inviter.id
                }))
            ]
        }), "DMResult", "DMError");

        if (DMError) {
            interaction.channel.send({
                content: `<@${inviter.id}> has invited <@${invitee.id}> to join Eden 🌳! BIG WAGMI ENERGY!⚡`,
                embeds: [
                    embedContent.setDescription(sprintf(CONSTANT.CONTENT.INVITE_DM_FAIL, {
                        onboardLink: CONSTANT.LINK.SIGNUP,
                        inviteeId: invitee.id
                    }))
                ]
            })
            return interaction.followUp({
                content: sprintf("Invite message has been sent to <#%s>", interaction.channel.id)
            })
        }
        return interaction.followUp({
            embeds: [
                new MessageEmbed()
                    .setTitle("We've sent your friend a DM 🌳")
                    .setDescription("Growing the garden of opportunities is how we are all going to make it.❤️")
            ]
        })
    }

}