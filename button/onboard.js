const { ButtonInteraction} = require("discord.js");
const myCache = require("../helper/cache");

module.exports = {
    customId: ["onboard"],
    /**
     * @param  {ButtonInteraction} interaction
     */
    async execute(interaction){

        if (interaction.customId == this.customId[0]){
            const message = interaction.message;
            let button = message.components;
            button[0].components[0].disabled = true;

            let embeds = message.embeds;
            embeds[0].setTitle(`${interaction.channel.name} Statistics Ended`);

            await message.edit({
                embeds: embeds,
                components: button
            });
            myCache.set("voiceContext", null);

            return interaction.reply({
                content: "Onboarded your crew!",
                ephemeral: true
            })
        }
    }
   
}