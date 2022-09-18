const { AutocompleteInteraction } = require("discord.js");
const myCache = require("../helper/cache")

module.exports = {
    match: [
        ["admin", "remove", "role"],
        ["admin", "remove", "user"],
        ["admin", "remove", "command"],
    ],

    /**
     * @param  {AutocompleteInteraction} interaction
     */
    async execute(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        if (myCache.has("server")){
            const cached = myCache.get("server")[interaction.guild.id];
            if (!cached) return interaction.respond([]);
            let filter;
            switch (focusedOption.name){
                case this.match[0][2]:
                    const roles = interaction.guild.roles.cache;
                    filter = cached.adminRoles.map(value => ({
                        name: roles.get(value)?.name ?? "Unknown Role",
                        value: value
                    })).filter(value => value.name.includes(focusedOption.value));
                    break;
                case this.match[1][2]:
                    const members = interaction.guild.members.cache;
                    filter = cached.adminID.map(value => ({
                        name: members.get(value)?.displayName ?? "Unknown Member",
                        value: value
                    })).filter(value => value.name.includes(focusedOption.value));
                    break;
                case this.match[2][2]:
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
