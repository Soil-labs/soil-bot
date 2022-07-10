const { AutocompleteInteraction } = require("discord.js");
const myCache = require("../helper/cache")
module.exports = {
    attachedCommand: ["skill", "user"],
    options: ["user"],

    /**
     * @param  {AutocompleteInteraction} interaction
     */
    async execute(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name == this.options[0]) {
            //Remove null title

            const choices = myCache.get("users").filter(value => value.discordName)

            const filtered = choices.filter(value => value.discordName.startsWith(focusedOption.value));
            if (filtered.length == 0) {
                return interaction.respond([])
            } else {
                return interaction.respond(
                    filtered.map(value => ({ name: value.discordName, value: value._id }))
                )
            }
        }
    }
}
