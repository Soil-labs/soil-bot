const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client } = require("discord.js");
const { fetchProjects, fetchSkills, fetchUsers, fetchUnverifiedSkills, fetchTeams, fetchServer } = require("../helper/graphql");
const myCache = require("../helper/cache")
const logger = require("../helper/logger");
const AsciiTable = require('ascii-table/ascii-table');

module.exports = {
    //event name
    name: "ready",
    //execute once only
    once: true,
    
    /**
     * @param  {Client} client
     * @param  {JSON} commands
     */
    async execute (client, commands){

        logger.info('Bot is online');

        const clientId = client.user.id;
        const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

        const loadCache = async() =>{
            const [projects , projectsError] = await fetchProjects();
            const [skills, skillsError] = await fetchSkills();
            const [unverifiedSkills, unverifiedSkillsError] = await fetchUnverifiedSkills();
            const [users, usersError] = await fetchUsers();
            const [teams, teamError] = await fetchTeams();
            const [server, serverError] = await fetchServer({ guildId: process.env.GUILDID });
            const table = new AsciiTable("Cache Loading ...");
            table.setHeading("Data", "Status")
            if (projects) {
                myCache.set("projects", projects);
                table.addRow("Projects", "✅ Fetched and cached");
            }else table.addRow("Projects", `❌ Error: ${projectsError}`);
            if (skills){
                myCache.set("skills", skills);
                table.addRow("Skills", "✅ Fetched and cached");
            }else table.addRow("Skills", `❌ Error: ${skillsError}`)
            if (unverifiedSkills){
                myCache.set("unverifiedSkills", unverifiedSkills);
                table.addRow("Unverified Skills", "✅ Fetched and cached");
            }else table.addRow("Unverified Skills", `❌ Error: ${unverifiedSkillsError}`)            
            if (users){
                myCache.set("users", users);
                table.addRow("Users", "✅ Fetched and cached");
            } else table.addRow("Users", `❌ Error: ${usersError}`);
            if (teams){
                myCache.set("teams", teams);
                table.addRow("Teams", "✅ Fetched and cached");
            }else table.addRow("Teams", `❌ Error: ${teamError}`);
            //to-do correctly handle multiple server
            if (server){
                if (server.length == 0){
                    myCache.set("server", {
                        adminID: [],
                        adminRoles: [],
                        adminCommands: []
                    });
                }else  myCache.set("server", server[0]);
                table.addRow("Server", "✅ Fetched and cached");
            }else table.addRow("Server", `❌ Error: ${serverError}`);
            logger.info(`\n${table.toString()}`);
        }

        await loadCache();

        myCache.on("expired", async(key, value) => {
            if (key == "projects"){
                const [projects, projectsError] = await fetchProjects();
                if (projects) myCache.set("projects", projects);
            }

            if (key == "skills"){
                const [skills, skillsError] = await fetchSkills();
                if (skills) myCache.set("skills", skills)
            }

            if (key == "users"){
                const [users, usersError] = await fetchUsers();
                if (users) myCache.set("users", users)
            }

            if (key == "teams"){
                const [teams, teamError] = await fetchTeams();
                myCache.set("teams", teams);
            }

            if (key == "server"){
                const [server, serverError] = await fetchServer({ guildId: process.env.GUILDID });
                if (server.length == 0){
                    myCache.set("server", {
                        adminID: [],
                        adminRoles: [],
                        adminCommands: []
                    });
                }else  myCache.set("server", server[0]);
            }
        })

        try{
            if (process.env.SLASH_CMD_ENV == "production"){
                await rest.put(Routes.applicationCommands(clientId), {
                    //JSON Format
                    body: commands 
                });
                logger.info("Commands are set globally");
            }else{
                const guild = client.guilds.cache.get(process.env.GUILDID);
                await guild.members.fetch();
                await guild.channels.fetch();
                //Set commands only available in this guild 
                await rest.put(Routes.applicationGuildCommands(clientId, process.env.GUILDID), {
                    //JSON Format
                    body: commands 
                });
                logger.info("Commands are set locally");
            }
        }catch (err){
            logger.info(err);
        }
    }
}