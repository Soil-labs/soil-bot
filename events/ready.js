const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const {Client} = require("discord.js");
const {fetchProjects, fetchSkills, fetchUsers} = require("../helper/graphql");
const myCache = require("../helper/cache")
const logger = require("../helper/logger");
const AsciiTable = require('ascii-table/ascii-table');
require("dotenv").config()

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

        const guild = client.guilds.cache.get(process.env.GUILDID);
        //Cache guild members
        await guild.members.fetch();

        const loadCache = async() =>{
            const [projects , projectsError] = await fetchProjects();
            const [skills, skillsError] = await fetchSkills();
            const [users, usersError] = await fetchUsers();
            const table = new AsciiTable("Cache Loading ...");
            table.setHeading("Data", "Status")
            if (projects) {
                myCache.set("projects", projects);
                table.addRow("Projects", "✅ Fetched and cached");
            }else table.addRow("Projects", "❌ Error")
            if (skills){
                myCache.set("skills", skills);
                table.addRow("Skills", "✅ Fetched and cached");
            }else table.addRow("Skills", "❌ Error")
            if (users){
                myCache.set("users", users);
                table.addRow("Users", "✅ Fetched and cached");
            } else table.addRow("Users", "❌ Error")
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
        })
        try{
            if (process.env.ENV == "production"){
                await rest.put(Routes.applicationCommands(clientId), {
                    //JSON Format
                    body: commands 
                });
                logger.info("Commands are set globally");
            }else{
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