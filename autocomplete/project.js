const {AutocompleteInteraction} = require("discord.js");
const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");


module.exports = {
    attachedCommand: ["project", "update", "search"],
    options: ["project_name", "project"],

    /**
     * @param  {AutocompleteInteraction} interaction
     */
    async execute(interaction){
        const focusedOption = interaction.options.getFocused(true);
        if (this.options.includes(focusedOption.name)){
            const choices = myCache.get("projects").filter(value => value.title)
            const filtered = choices.filter(value => value.title.startsWith(focusedOption.value))
                .splice(0, CONSTANT.NUMERICAL_VALUE.AUTOCOMPLETE_OPTION_LENGTH);
            if (filtered.length == 0) {
                return interaction.respond([])
            } else {
                return interaction.respond(
                    filtered.map(value => ({ name: value.title, value: value._id }))
                )
            }
        }
    }
}
