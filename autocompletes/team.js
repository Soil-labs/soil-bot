const { AutocompleteInteraction } = require("discord.js");
const CONSTANT = require("../helper/const");
const myCache = require("../helper/cache");

module.exports = {
    attachedCommand: ["update"],
    options: ["team"],

    /**
     * @param  {AutocompleteInteraction} interaction
     */
    async execute(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (this.options.includes(focusedOption.name)) {
            if (myCache.has("teams")){
                if (interaction.options.getSubcommand() == "garden"){
                    const cached = myCache.get("teams");
                    const teamsInGuild = cached[interaction.guild.id];
                    if (!teamsInGuild || Object.keys(teamsInGuild).length == 0) return interaction.respond([]);

                    const filter = Object.keys(teamsInGuild).filter((teamId) => (
                        teamsInGuild[teamId].name.toLowerCase().startsWith(focusedOption.value.toLowerCase())
                    )).map((teamId) => ({
                        name: teamsInGuild[teamId].name,
                        value: teamId
                    })).slice(0, CONSTANT.NUMERICAL_VALUE.AUTOCOMPLETE_OPTION_LENGTH);
                                            
                    if (filter.length == 0){
                        return interaction.respond([]);
                    }else{
                        return interaction.respond(filter)
                    }
                }
            }else{
                return interaction.respond([]);
            }
            
        }
    }
}
