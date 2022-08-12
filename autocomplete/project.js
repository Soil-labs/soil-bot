const {AutocompleteInteraction} = require("discord.js");
const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");


module.exports = {
    attachedCommand: ["project", "update", "search"],
    options: ["project"],

    /**
     * @param  {AutocompleteInteraction} interaction
     */
    async execute(interaction){
        const focusedOption = interaction.options.getFocused(true);
        if (this.options.includes(focusedOption.name)){
            if (myCache.has("projects")){
                const cached = myCache.get("projects");
                const projectsInGuild = cached[interaction.guild.id];
                if (Object.keys(projectsInGuild).length == 0) return interaction.respond([]);

                const filtered = Object.keys(projectsInGuild).filter((projectId) => {
                    return projectsInGuild[projectId].title.includes(focusedOption.value)
                }).map((projectId) => ({
                    name: projectsInGuild[key].title,
                    value: projectId
                })).slice(0, CONSTANT.NUMERICAL_VALUE.AUTOCOMPLETE_OPTION_LENGTH);
                
                if (filtered.length == 0) {
                    return interaction.respond([])
                } else {
                    return interaction.respond(filtered)
                }
            }else{
                return interaction.respond([])
            }
        }
    }
}
