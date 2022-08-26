const { AutocompleteInteraction } = require("discord.js");
const myCache = require("../helper/cache");
const CONSTANT = require("../helper/const");
const { validProject, validTeam } = require("../helper/util");


module.exports = {
    match: [
        ["update", "garden", "project"],
        ["update", "garden", "team"],
        ["update", "garden", "role"],
    ],

    /**
     * @param  {AutocompleteInteraction} interaction
     */
    async execute(interaction){
        const guildId = interaction.guild.id;        
        const focusedOption = interaction.options.getFocused(true);
        if (!myCache.has("projectTeamRole")) return interaction.respond([]);

        const projectTeamRoleInGuild = myCache.get("projectTeamRole")[guildId];
        if (!projectTeamRoleInGuild || Object.keys(projectTeamRoleInGuild).length == 0) return interaction.respond([]);

        const options = interaction.options._hoistedOptions;
        const resolvedProject = interaction.options.getString("project");
        const resolvedTeam = interaction.options.getString("team");
        const resolvedRole = interaction.options.getString("role");

        // console.log(options)
        // console.log("project", interaction.options.getString("project"));
        // console.log("team", interaction.options.getString("team"))
        // console.log("role", interaction.options.getString("role"))

        if (focusedOption.name == "project"){
            const filtered = Object.keys(projectTeamRoleInGuild).filter((projectId) => {
                return projectTeamRoleInGuild[projectId].title.toLowerCase().startsWith(focusedOption.value.toLowerCase())
            }).map((projectId) => ({
                name: projectTeamRoleInGuild[projectId].title,
                value: projectId
            })).slice(0, CONSTANT.NUMERICAL_VALUE.AUTOCOMPLETE_OPTION_LENGTH);

            if (filtered.length == 0) {
                return interaction.respond([])
            } else {
                return interaction.respond(filtered);
            }
        }

        if (focusedOption.name == "team"){
            const teams = projectTeamRoleInGuild[resolvedProject];
            if(!teams) return interaction.respond([]);
            // console.log(teams)
            const teamFilter = Object.keys(teams).filter((teamId) => {
                if (teamId == "title") return false;
                return teams[teamId].name.toLowerCase().startsWith(focusedOption.value.toLowerCase())
            }).map((teamId) => ({
                name: teams[teamId].name,
                value: teamId
            })).slice(0, CONSTANT.NUMERICAL_VALUE.AUTOCOMPLETE_OPTION_LENGTH);

            if (teamFilter.length == 0) {
                return interaction.respond([]);
            }
            else {
                return interaction.respond(teamFilter);
            }
        }
        if (focusedOption.name == "role"){
            const roles = projectTeamRoleInGuild[resolvedProject]?.[resolvedTeam];
            if(!projectTeamRoleInGuild[resolvedProject]?.[resolvedTeam]) return interaction.respond([]);

            const roleFilter = Object.keys(roles).filter((roleId) => {
                if (roleId == "name") return false;
                return roles[roleId].name.toLowerCase().startsWith(focusedOption.value.toLowerCase())
            }).map((roleId) => ({
                name: roles[roleId].name,
                value: roleId
            })).slice(0, CONSTANT.NUMERICAL_VALUE.AUTOCOMPLETE_OPTION_LENGTH);
            if (roleFilter.length == 0) {
                return interaction.respond([]);
            }
            else {
                return interaction.respond(roleFilter);
            }
        }
    }
}
