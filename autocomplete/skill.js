const { AutocompleteInteraction } = require("discord.js");
const myCache = require("../helper/cache")
module.exports = {
    attachedCommand: ["endorse", "search"],
    options: ["skill"],

    /**
     * @param  {AutocompleteInteraction} interaction
     */
    async execute(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name == this.options[0]) {
            //Remove null title
            const choices = myCache.get("skills").filter(value => value.name)

            const filtered = choices.filter(value => value.name.startsWith(focusedOption.value));
            if (filtered.length == 0) {
                return interaction.respond([])
            } else {
                return interaction.respond(
                    filtered.map(value => ({ name: value.name, value: value._id}))
                )
            }
        }
    }
}
