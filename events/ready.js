const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const {Client} = require("discord.js");
const {fetchProjects, fetchSkills, fetchUsers} = require("../helper/graphql");
const myCache = require("../helper/cache")
const logger = require("../helper/logger");
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

        const [projects , projectsError] = await fetchProjects();
        const [skills, skillsError] = await fetchSkills();
        const [users, usersError] = await fetchUsers();
        if (projects) myCache.set("projects", projects);
        if (skills) myCache.set("skills", skills)
        if (users) myCache.set("users", users)

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
                const [users, usersError] = await fetchSkills();
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