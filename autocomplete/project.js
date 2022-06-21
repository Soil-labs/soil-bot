const {AutocompleteInteraction} = require("discord.js");
const { name } = require("../events/ready");

module.exports = {
    attachedCommand: ["project", "update"],
    options: "",

    /**
     * @param  {AutocompleteInteraction} interaction
     */
    async execute(interaction){
        const focusedOption = interaction.options.getFocused(true);
        const choices = ['faq', 'install', 'collection', 'promise', 'debug', 'abc', 'abcdef', 'contributor'];

        const filtered = choices.filter(value => value.startsWith(focusedOption.value));
        if (filtered.length == 0){
            return interaction.respond([])
        }else{
            return interaction.respond(
                filtered.map(value => ({ name: value, value: value }))
            )
        }
    }
}