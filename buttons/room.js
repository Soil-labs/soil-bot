const { PermissionFlagsBits } = require("discord-api-types/v9");
const { ButtonInteraction} = require("discord.js");
const { sprintf } = require("sprintf-js");

const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");

module.exports = {
    customId: ["project", "talent"],
    /**
     * @param  {ButtonInteraction} interaction
     */
    async execute(interaction){ 
        const { customId, channel } = interaction;
        if(!channel.permissionsFor(interaction.guild.me).has(PermissionFlagsBits.CreatePublicThreads)) return interaction.reply({
            content: "Sorry, I cannot create a public thread here.",
            ephemeral: true
        })
        await interaction.deferReply({ephemeral: true})
        const thread = await channel.threads.create({
            name: `${customId == this.customId[0] ? "Project" : "Talent"} Onboarding -- ${interaction.user.username}`
        })
        if (customId == this.customId[0]){
            thread.send({
                content: "1. What role are you looking for?\n2. What skills does this person have?\n3. What is the overall proficiency of this person?\n4. Offer link to platform view"
            })
            return interaction.followUp({
                content: `Thread <#${thread.id}> has been created.`
            })
        }else{
            thread.send({
                content: "1. What is your role?\n2. What skills to do you have?\n3. What is your overall proficiency\n4. Offer link for platform view"
            })
            return interaction.followUp({
                content: `Thread <#${thread.id}> has been created.`
            })
        }
    }
   
}