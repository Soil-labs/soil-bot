const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { validUser, insertVerticalBar } = require('../helper/util');
const { matchMember, fetchUserDetail } = require('../helper/graphql');
const { sprintf } = require('sprintf-js');
const { AsciiTable3, AlignmentEnum } = require('ascii-table3');

require("dotenv").config()

module.exports = {
    commandName: "match",
    description: "Find a potential member matching your skills",

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
        const isValidUser = validUser(interaction.user.id);

        if (!isValidUser) return interaction.reply({
            content: "Sorry, you are not a member of Soil. Please use \`/onboard\` command to join in our family!",
            ephemeral: true
        })
        await interaction.deferReply({
            ephemeral: true
        })
        const [matchResult, matchError] = await matchMember({ memberId: interaction.user.id });

        if (matchError) return interaction.followUp({
            content: `Error occured when matching: \`${matchError.response.errors[0].message}\``
        })

        if (matchResult.length == 0) {
            const [userDetail, userDetailError] = await fetchUserDetail({ userID: interaction.user.id });

            if (userDetailError) return interaction.followUp({
                content: `Sorry, we cannot find a match for you. Error occured when fetching your profile: \`${matchError.response.errors[0].message}\`.`
            })

            if (!userDetail.skills.length) return interaction.followUp({
                content: `Sorry, we cannot find a match for you because you don't have any skill. Try to find someone to endorse you!`
            })

            return interaction.followUp({
                content: `Sorry, we cannot find a match for you without a detailed reason. Please report this case to our team.`
            })
        }
        const table = new AsciiTable3(`${interaction.member.displayName} Matching Result`)
            .setHeading("⚙️Similarity", "🧙Name", "💻Common Skill")
            .setAlign(3, AlignmentEnum.CENTER);

        const matchContent = matchResult.sort((first, second) => {
            return second.matchPercentage - first.matchPercentage
        }).map((value) => {
            const memberInGuild = interaction.guild.members.cache.get(value.member._id);
            const name = memberInGuild ? value.member.discordName : `<@${value.member._id}>`;
            const skillList = insertVerticalBar(value.commonSkills.map(value => value.name));
            table.addRow(sprintf("%.2f%%", value.matchPercentage), value.member.discordName, skillList)
            return sprintf("> ⚙️Similarity: %.2f%%   🧙Name: %s 💻Common Skill: %s\n", value.matchPercentage, name, skillList);
        }).toString().replace(/,/g, '');

        console.log(table.toString())
        return interaction.followUp({
            content: table.toString(),
            embeds: [
                new MessageEmbed()
                    .setTitle(`${interaction.member.displayName} Matching Result`)
                    .setDescription(matchContent)
            ]
        })

    }

}