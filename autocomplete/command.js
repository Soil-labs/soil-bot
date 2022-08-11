const { AutocompleteInteraction } = require("discord.js");
const myCache = require("../helper/cache")
const CONSTANT = require("../helper/const");

module.exports = {
    attachedCommand: ["set"],
    options: ["command"],

    /**
     * @param  {AutocompleteInteraction} interaction
     */
    async execute(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        const subCommand = interaction.options.getSubcommand();
        if (this.options.includes(focusedOption.name)){
            if (subCommand == "add"){
                if (!myCache.has("command")){
                    const commands = (await interaction.guild.commands.fetch()).map((command) => ({
                        name: command.name,
                        value: command.id
                    }));
                    myCache.set("command", commands);
                }

                const cached = myCache.get("command");
                const filter = cached.filter(value => value.name.startsWith(focusedOption.value));
                if (filter.length == 0) return interaction.respond([]);
                else return interaction.respond(filter);
            }else{

            }
        }
    }
}
