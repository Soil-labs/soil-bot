const { AutocompleteInteraction } = require("discord.js");
const CONSTANT = require("../helper/const");

module.exports = {
    match: [
        ["birthday", "timezone"],
    ],

    /**
     * @param  {AutocompleteInteraction} interaction
     */
    async execute(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.value == '') return interaction.respond(CONSTANT.TIMEZONES.slice(0, CONSTANT.NUMERICAL_VALUE.AUTOCOMPLETE_OPTION_LENGTH));
        const filter = CONSTANT.TIMEZONES.filter((value) => (value.name.includes(focusedOption.value)));
        if (filter.length == 0) return interaction.respond([]);
        else return interaction.respond(filter.slice(0, CONSTANT.NUMERICAL_VALUE.AUTOCOMPLETE_OPTION_LENGTH));
    }
}
