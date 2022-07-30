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
                    const filter = myCache.get("teams").filter(value => value.name.startsWith(focusedOption.value))
                        .splice(0, CONSTANT.NUMERICAL_VALUE.AUTOCOMPLETE_OPTION_LENGTH);          
                        
                    if (filter.length == 0){
                        return interaction.respond([]);
                    }else{
                        return interaction.respond(
                            filter.map(value => ({ name: value.name, value: value._id }))
                        )
                    }
                }
            }else{
                return interaction.respond([]);
            }
            
        }
    }
}
