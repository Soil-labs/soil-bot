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
        if (this.options.includes(focusedOption.name)){
            const choices = myCache.get("projects").filter(value => value.title)
            const filtered = choices.filter(value => value.title.startsWith(focusedOption.value));
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
