const { AutocompleteInteraction } = require("discord.js");
const myCache = require("../helper/cache")
const CONSTANT = require("../helper/const");

module.exports = {
    attachedCommand: ["endorse", "search", "find"],
    options: ["skill", "skill_1", "skill_2", "skill_3", "skill_4"],

    /**
     * @param  {AutocompleteInteraction} interaction
     */
    async execute(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (this.options.includes(focusedOption.name)) {
            if (myCache.has("skills")){
                const skills = myCache.get("skills");
                if (Object.keys(skills).length == 0) return interaction.respond([]);

                const filtered = Object.keys(skills).filter((skillId) => (
                    skills[skillId].name.toLowerCase().startsWith(focusedOption.value.toLowerCase()) 
                )).map((skillId) => ({
                    name: skills[skillId].name,
                    value: skillId
                })).slice(0, CONSTANT.NUMERICAL_VALUE.AUTOCOMPLETE_OPTION_LENGTH);
                    
                if (filtered.length == 0) {
                    return interaction.respond([])
                } else {
                    return interaction.respond(filtered)
                }
            }
        }
    }
}
