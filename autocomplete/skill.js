const { AutocompleteInteraction } = require("discord.js");
module.exports = {
    attachedCommand: ["skill"],
    options: ["skill"],

    /**
     * @param  {AutocompleteInteraction} interaction
     */
    async execute(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (focusedOption.name == this.options[0]) {
            const choices = ['python', 'js', 'tx', 'React.js', 'NextJs', 'Frontend', 'Solidity', 'Database'];

            const filtered = choices.filter(value => value.startsWith(focusedOption.value));
            if (filtered.length == 0) {
                return interaction.respond([])
            } else {
                return interaction.respond(
                    filtered.map(value => ({ name: value, value: value }))
                )
            }
        }
    }
}
