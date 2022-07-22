const { AutocompleteInteraction } = require("discord.js");
const myCache = require("../helper/cache")
module.exports = {
    attachedCommand: ["endorse", "search", "match"],
    options: ["skill", "skill_name_1", "skill_name_2", "skill_name_3", "skill_name_4"],

    /**
     * @param  {AutocompleteInteraction} interaction
     */
    async execute(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (this.options.includes(focusedOption.name)) {
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
