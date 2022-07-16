const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");
const { updateUser } = require("../helper/graphql");
const { validUser, awaitWrap } = require('../helper/util');
const { sprintf } = require('sprintf-js');
const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");

require("dotenv").config()

module.exports = {
    commandName: "invite",
    description: "Invite a newcomer to Soil🌱",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addUserOption(option =>
                option.setName("user")
                    .setDescription("The member you'd like to support")
                    .setRequired(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const author = interaction.user
        if (user.id == author.id) return interaction.reply({
            content: "Sorry, you cannot invite yourself.",
            ephemeral: true
        })
        if (user.bot) return interaction.reply({
            content: "Sorry, you cannot choose a bot as a target.",
            ephemeral: true
        })
        const isNewAuthor = validUser(author.id);
        if (!isNewAuthor) return interaction.reply({
            content: "Please use \`/onboard\` command to onboard yourself first"
        })

        const isNewUser = validUser(user.id);
        if (isNewUser) return interaction.reply({
            content: "Sorry, this user has been onboarded.",
            ephemeral: true
        })

        const userInform = {
            _id: user.id,
            discordName: user.username,
            discriminator: user.discriminator,
            discordAvatar: user.displayAvatarURL({ format: 'jpg' })
        }

        await interaction.deferReply({
            ephemeral: true
        })
        const [result, error] = await updateUser(userInform);

        if (error) return interaction.followUp({
            content: `Error occured: \`${error.response.errors[0].message}\``
        })

        //Add newcomer into the cache
        myCache.set("users", [ ...myCache.get("users"), userInform ])

        const onboardLink = sprintf(CONSTANT.LINK.ONBOARD, user.id);
        const DMchannel = await user.createDM();
        const { DMResult, DMError } = await awaitWrap(DMchannel.send({
            content: sprintf(CONSTANT.CONTENT.INVITE_DM, {
                inviterName: interaction.member.displayName,
                onboardLink: onboardLink
            })
        }), "DMResult", "DMError")
        if (DMError) {
            interaction.channel.send({
                content: sprintf(CONSTANT.CONTENT.INVITE_DM_FAIL, {
                    inviteeId: user.id,
                    inviterId: author.id,
                    onboardLink: onboardLink
                })
            })
            return interaction.followUp({
                content: sprintf("Invite message has been sent to <#%s>", interaction.channel.id)
            })
        }
        return interaction.followUp({
            content: sprintf("DM is sent to \`%s\`", user.username)
        })


        //Update Cache
        // const tmp = myCache.get("users");
        // const idArray = tmp.map(value => value._id);
        // const index = idArray.indexOf(updateCache._id);
        // tmp.splice(index, 1, userInform);
        // myCache.set("users", tmp)
    }

}