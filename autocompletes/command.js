const { AutocompleteInteraction } = require("discord.js");
const myCache = require("../helper/cache")
const CONSTANT = require("../helper/const");

module.exports = {
    attachedCommand: ["admin"],
    options: ["role", "user", "command"],

    /**
     * @param  {AutocompleteInteraction} interaction
     */
    async execute(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (this.options.includes(focusedOption.name)){
            if (myCache.has("server")){
                const cached = myCache.get("server")[interaction.guild.id];
                if (!cached) return interaction.respond([]);
                let filter;
                switch (focusedOption.name){
                    case "role":
                        const roles = interaction.guild.roles.cache;
                        filter = cached.adminRoles.map(value => ({
                            name: roles.get(value)?.name ?? "Unknown Role",
                            value: value
                        })).filter(value => value.name.includes(focusedOption.value));
                        break;
                    case "user":
                        const members = interaction.guild.members.cache;
                        filter = cached.adminID.map(value => ({
                            name: members.get(value)?.displayName ?? "Unknown Member",
                            value: value
                        })).filter(value => value.name.includes(focusedOption.value));
                        break;
                    case "command":
                        filter = cached.adminCommands.filter(value => value.includes(focusedOption.value))
                            .map(value => ({
                                name: value,
                                value: value
                            }));
                }
                return interaction.respond(filter.length == 0 ? [] : filter)
            }else{
                return interaction.respond([]);
            }
        }
    }
}
