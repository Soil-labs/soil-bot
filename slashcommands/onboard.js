const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { validUser } = require('../helper/util');
const { updateUser, addNewMember } = require('../helper/graphql');
const { sprintf } = require('sprintf-js');
const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");
const _ = require("lodash");

require("dotenv").config()

module.exports = {
    commandName: "onboard",
    description: "Find & be found for opportunity",

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
        const searchResult = validUser(user.id);

        const onboardLink = sprintf(CONSTANT.LINK.AIRTABLE_ONBOARDING, {
            discordName: encodeURIComponent(interaction.user.username),
            discordId: interaction.user.id
        })

        const replyEmbed = new MessageEmbed()
            .setTitle("🥰Planting seeds for yourself & others how WAGMI🥰")
            .setDescription(sprintf(CONSTANT.CONTENT.ONBOARD, { onboardLink: onboardLink }));

        const userInform = {
            _id: user.id,
            discordName: user.username,
            discriminator: user.discriminator,
            discordAvatar: user.displayAvatarURL()
        }

        if (searchResult) {
            const [result, error] = await updateUser(userInform);

            if (error) return interaction.reply({
                content: `Error occured when onboarding yourself: \`${error.response.errors[0].message}\``,
                ephemeral: true
            });

            const index = _.findIndex(myCache.get("users"), (element) => {
                element._id == user.id
            })

            const tmp = myCache.get("users");
            tmp.splice(index, 1, userInform);
            myCache.set("users", tmp);
            
        }else{
            const [result, error] = await addNewMember(userInform);

            if (error) return interaction.reply({
                content: `Error occured when onboarding yourself: \`${error.response.errors[0].message}\``,
                ephemeral: true
            });
            myCache.set("users", [ ...myCache.get("users"), userInform ])
        }

        return interaction.reply({
            embeds: [replyEmbed],
            ephemeral: true
        })

    }

}