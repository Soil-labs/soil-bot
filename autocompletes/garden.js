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
        const userId = interaction.member.id;
        const focusedOption = interaction.options.getFocused(true);
        if (!myCache.has("projects") || !myCache.has("gardenContext")) return interaction.respond([{
            name: "Sorry, system is init",
            value: '0'
        }])
        const projectsInGuild = myCache.get("projects")[guildId];
        if (!projectsInGuild || Object.keys(projectsInGuild).length == 0) return interaction.respond([{
            name: "Not found any project in this guild, garden is disabled",
            value: '0'
        }]);

        let gardenContext = myCache.get("gardenContext", {});
        
        console.log(interaction.options)
        console.log(gardenContext)

        if (focusedOption.name == "project"){
            const filtered = Object.keys(projectsInGuild).filter((projectId) => {
                return projectsInGuild[projectId].title.toLowerCase().startsWith(focusedOption.value.toLowerCase())
            }).map((projectId) => ({
                name: projectsInGuild[projectId].title,
                value: projectId
            })).slice(0, CONSTANT.NUMERICAL_VALUE.AUTOCOMPLETE_OPTION_LENGTH);

            if (userId in gardenContext) {
                if (filtered.length == 1 && gardenContext[userId].guildId == guildId){
                    gardenContext[userId] = {
                        guildId: guildId,
                        projectId: filtered[0].value,
                        teamId: null,
                        roleId: null
                    }
                }else {
                    gardenContext[userId] = {
                        guildId: guildId,
                        projectId: null,
                        teamId: null,
                        roleId: null
                    }
                }
            }else{
                gardenContext[userId] = {
                    guildId: guildId,
                    projectId: null,
                    teamId: null,
                    roleId: null
                }
            }
            
            if (filtered.length == 0) {
                gardenContext[userId] = {
                    guildId: guildId,
                    projectId: null,
                    teamId: null,
                    roleId: null
                }
                myCache.set("gardenContext", gardenContext);
                return interaction.respond([{
                    name: "Not found any project in this guild",
                    value: '0'
                }]);
            } else {
                myCache.set("gardenContext", gardenContext);
                return interaction.respond(filtered);
            }
        }
        if (focusedOption.name == "team"){
            if (userId in gardenContext) {
                if (gardenContext[userId].guildId != guildId){
                    gardenContext[userId] = {
                        guildId: guildId,
                        projectId: null,
                        teamId: null,
                        roleId: null
                    }
                    myCache.set("gardenContext", gardenContext);
                    return interaction.respond([{
                        name: "Please choose a project first",
                        value: '0'
                    }]);
                }

                let projectId = gardenContext[userId].projectId;
                const possibleProjectId = interaction.options.getString("project");
                console.log(possibleProjectId)
                if (validProject(possibleProjectId, guildId)) {
                    gardenContext[userId].projectId = possibleProjectId;
                    projectId = possibleProjectId;
                }
                if (projectId){
                    const teams = projectsInGuild[projectId];
                    console.log(teams);
                    // Only Attribute `title`
                    if (Object.keys(teams).length == 1) {
                        gardenContext[userId] = {
                            guildId: guildId,
                            projectId: null,
                            teamId: null,
                            roleId: null
                        }
                        myCache.set("gardenContext", gardenContext);
                        return interaction.respond([{
                            name: "Not found any team in this project, please choose another project",
                            value: '0'
                        }]);
                    }
                    console.log(focusedOption.value)
                    const teamFilter = Object.keys(teams).filter((teamId) => {
                        if (teamId == "title") return false;
                        return teams[teamId].name.toLowerCase().startsWith(focusedOption.value.toLowerCase())
                    }).map((teamId) => ({
                        name: teams[teamId].name,
                        value: teamId
                    })).slice(0, CONSTANT.NUMERICAL_VALUE.AUTOCOMPLETE_OPTION_LENGTH);
                    console.log(teamFilter)
                    if (teamFilter.length == 1){
                        gardenContext[userId] = {
                            ...gardenContext[userId],
                            teamId: teamFilter[0].value,
                        }
                    }
                    if (teamFilter.length == 0) {
                         gardenContext[userId] = {
                            ...gardenContext[userId],
                            teamId: null
                        }
                        myCache.set("gardenContext", gardenContext);
                        return interaction.respond([{
                            name: "Please input a valid team name",
                            value: '0'
                        }])
                    }
                    else {
                        myCache.set("gardenContext", gardenContext);
                        return interaction.respond(teamFilter);
                    }
                }else{
                    gardenContext[userId] = {
                        guildId: guildId,
                        projectId: null,
                        teamId: null,
                        roleId: null
                    }
                    myCache.set("gardenContext", gardenContext);
                    return interaction.respond([{
                        name: "Please choose a project first",
                        value: '0'
                    }]);
                }
            }else{
                return interaction.respond([{
                    name: "Please choose a project first",
                    value: '0'
                }]);
            }
        }
        if (focusedOption.name == "role"){
            if (userId in gardenContext) {
                if (gardenContext[userId].guildId != guildId) {
                    gardenContext[userId] = {
                        guildId: guildId,
                        projectId: null,
                        teamId: null,
                        roleId: null
                    }
                    myCache.set("gardenContext", gardenContext);
                    return interaction.respond([{
                        name: "Please choose a team first",
                        value: '0'
                    }]);
                }
                
                let { projectId, teamId } = gardenContext[userId];
                const possibleTeamId = interaction.options.getString("team");
                if (validTeam(possibleTeamId, guildId)){
                    gardenContext[userId].teamId = possibleTeamId;
                    teamId = possibleTeamId;
                }   
                if (projectId && teamId){
                    const roles = projectsInGuild[projectId][teamId];
                    // Only Attribute `Name`
                    if (Object.keys(roles).length == 1) {
                        myCache.set("gardenContext", gardenContext);
                        return interaction.respond([{
                            name: "Not found any role in this team, please choose another team",
                            value: '0'
                        }]);
                    }
                    const roleFilter = Object.keys(roles).filter((roleId) => {
                        if (roleId == "name") return false;
                        return roles[roleId].name.toLowerCase().startsWith(focusedOption.value.toLowerCase())
                    }).map((roleId) => ({
                        name: roles[roleId].name,
                        value: roleId
                    })).slice(0, CONSTANT.NUMERICAL_VALUE.AUTOCOMPLETE_OPTION_LENGTH);
                    if (roleFilter.length == 1){
                        gardenContext[userId] = {
                            ...gardenContext[userId],
                            roleId: roleFilter[0].value,
                        }
                    }
                    if (roleFilter.length == 0) {
                        gardenContext[userId] = {
                            ...gardenContext[userId],
                            roleId: null
                        }
                        myCache.set("gardenContext", gardenContext);
                        return interaction.respond([{
                            name: "Please input a valid role name",
                            value: '0'
                        }])
                    }
                    else {
                        myCache.set("gardenContext", gardenContext);
                        return interaction.respond(roleFilter);
                    }
                }else{
                    if (projectId && !teamId) {
                        gardenContext[userId] = {
                            ...gardenContext[userId],
                            teamId: null
                        }
                    }else{
                        gardenContext[userId] = {
                            guildId: guildId,
                            projectId: null,
                            teamId: null,
                            roleId: null
                        }
                    }
                    myCache.set("gardenContext", gardenContext);
                    return interaction.respond([{
                        name: "Please choose a team first",
                        value: '0'
                    }]);
                }
            }else{
                myCache.set("gardenContext", gardenContext);
                return interaction.respond([{
                    name: "Please choose a project first",
                    value: '0'
                }]);
            }
        }
    }
}
