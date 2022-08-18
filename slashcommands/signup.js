const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { validUser, updateUserCache } = require('../helper/util');
const { addNewMember, updateUser } = require('../helper/graphql');
const { sprintf } = require('sprintf-js');
const CONSTANT = require("../helper/const");


module.exports = {
    commandName: "signup",
    description: "join Eden 🌳 to find projects you love",

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
        await interaction.deferReply({ ephemeral: true });
        
        if (validResult){
            const [result, error] = await updateUser(inform);

            if (error) return interaction.followUp({
                content: `Error occured when onboarding yourself: \`${error}\``,
            });
        }else{ 
            const [result, error] = await addNewMember({
                ...inform,
                invitedBy: user.id,
                serverId: guildId
            });
            
            if (error) return interaction.followUp({
                content: `Error occured when onboarding yourself: \`${error}\``,
            });
        }

        updateUserCache(user.id, user.username, guildId);

        const replyEmbed = new MessageEmbed()
            .setTitle("Hooray! You're about to join Eden 🌳")
            .setDescription(sprintf(CONSTANT.CONTENT.ONBOARD_SELF, { onboardLink: CONSTANT.LINK.SIGNUP}));

        return interaction.followUp({
            embeds: [replyEmbed],
        })

    }

}