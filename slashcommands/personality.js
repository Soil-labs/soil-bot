const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");
const { validUser, updateUserCache } = require('../helper/util');
const { endorseAttribute, addNewMember } = require('../helper/graphql');
const { sprintf } = require('sprintf-js');
const CONSTANT = require("../helper/const");


module.exports = {
    commandName: "personality",
    description: "Endorse a specific  personality trait of someone",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addUserOption(option =>
                option.setName("person")
                    .setDescription("The member you'd like to endorse")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("trait")
                    .setDescription("Choose one of traits from the list")
                    .setChoices(
                        { name: "Director", value: "Director" },
                        { name: "Motivator", value: "Motivator" },
                        { name: "Inspirer", value: "Inspirer" },
                        { name: "Helper", value: "Helper" },
                        { name: "Supporter", value: "Supporter" },
                        { name: "Coordinator", value: "Coordinator" },
                        { name: "Observer", value: "Observer" },
                        { name: "Reformer", value: "Reformer" },
                    )
                    .setRequired(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const author = interaction.user;
        const user = interaction.options.getUser("person");
        const trait = interaction.options.getString("trait");
        const guildId = interaction.guild.id;

        if (user.id == author.id) return interaction.reply({
            content: "Sorry, you cannot endorse yourself with a trait.",
            ephemeral: true
        })

        //to-do onboard them in a smarter way, stupid implementation!
        const authorValidResult = validUser(author.id, guildId);
        if (!authorValidResult) {
            const authorInform = {
                _id: author.id,
                discordName: author.username,
                discriminator: author.discriminator,
                discordAvatar: author.displayAvatarURL({ format: 'jpg' }),
                invitedBy: author.id,
                serverId: guildId
            };

            await interaction.deferReply({
                ephemeral: true
            })

            const [authorResult, authorError] = await addNewMember(authorInform);

            if (authorError) return interaction.followUp({
                content: `Error occured when onboarding you: \`${error}\``
            })
            
            updateUserCache(author.id, author.username, guildId);
        }

        const validResult = validUser(user.id, guildId);
        if (!validResult) {
            const userInform = {
                _id: user.id,
                discordName: user.username,
                discriminator: user.discriminator,
                discordAvatar: user.displayAvatarURL({ format: 'jpg' }),
                invitedBy: user.id,
                serverId: guildId
            };

            if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

            const [userResult, userError] = await addNewMember(userInform);

            if (userError) return interaction.followUp({
                content: `Error occured when onboarding you: \`${error}\``
            })
            
            updateUserCache(user.id, user.username, guildId);
        }

        if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });
       
        const [result, error] = await endorseAttribute({
            memberId: user.id,
            attribute: trait
        });

        if (error) return interaction.followUp({
            content: `Error occured when uploading your endorsement: \`${error}\``
        });

        return interaction.followUp({
            content: sprintf(CONSTANT.CONTENT.ENDORSE_ATTRIBUTE, {
                endorseeName: user.username,
                attributeName: trait
            })
        })

    }

}