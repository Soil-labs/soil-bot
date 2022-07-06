const {AutocompleteInteraction} = require("discord.js");
const myCache = require("../helper/cache")

module.exports = {
    attachedCommand: ["project", "update", "search"],
    options: ["project_name"],

    /**
     * @param  {AutocompleteInteraction} interaction
     */
    async execute(interaction){
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name == this.options[0]){
            const choices = myCache.get("projects").filter(value => value.tagName)
            const filtered = choices.filter(value => value.tagName.startsWith(focusedOption.value));
            if (filtered.length == 0) {
                return interaction.respond([])
            } else {
                return interaction.respond(
                    filtered.map(value => ({ name: value.tagName, value: value._id }))
                )
            }
        }
    }
}
