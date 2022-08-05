const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { validUser } = require('../helper/util');
const { addNewMember } = require('../helper/graphql');
const { sprintf } = require('sprintf-js');
const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");
const _ = require("lodash");

require("dotenv").config()

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
        const validResult = validUser(user.id);

        const inform = {
            _id: user.id,
            discordName: user.username,
            discriminator: user.discriminator,
            discordAvatar: user.displayAvatarURL()
        };

        const [result, error] = await addNewMember(inform);

        if (error) return interaction.reply({
            content: `Error occured when onboarding yourself: \`${error.response.errors[0].message}\``,
            ephemeral: true
        })

        let cached = myCache.get("users");
        
        if (validResult){
            const index = _.findIndex(cached, (value) => { return value._id == user.id });
            cached.splice(index, 1, inform);
        }else{ 
            cached.push(inform);
        }

        myCache.set("users", cached);

        const onboardLink = sprintf(CONSTANT.LINK.AIRTABLE_ONBOARDING, {
            discordName: encodeURIComponent(user.username),
            discordId: user.id
        })

        const replyEmbed = new MessageEmbed()
            .setTitle("Join Soil 🌳 ")
            .setDescription(sprintf(CONSTANT.CONTENT.ONBOARD_SELF, { onboardLink: onboardLink }));

        return interaction.reply({
            embeds: [replyEmbed],
            ephemeral: true
        })

    }

}