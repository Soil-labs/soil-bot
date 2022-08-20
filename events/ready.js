const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client } = require("discord.js");
const { fetchProjects, fetchSkills, fetchUsers, fetchUnverifiedSkills, fetchTeams, fetchServer, updateServer } = require("../helper/graphql");
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
            const table = new AsciiTable("Cache Loading ...");
            table.setHeading("Data", "Status");

            const results = await Promise.all([
                fetchProjects(),
                fetchSkills(),
                fetchUnverifiedSkills(),
                fetchUsers(),
                fetchTeams()
            ]);
            const items = ["Project", "Skills", "Unverified Skills", "Users", "Teams"];
            let errorFlag = false;

            results.forEach((value, index) => {
                if (value) {
                    table.addRow(items[index], `❌ Error: ${value}`);
                    errorFlag = true;
                }else {
                    table.addRow(items[index], "✅ Fetched and cached");
                }
            })
            
            //to-do temp method to handle multi-guild auto onboarding
            myCache.set("voiceContext", {});
            table.addRow("Voice Context", "✅ Fetched and cached");
            
            //to-do can fetch 200 at most once, if > 200 we should loop it
            const guilds = await client.guilds.fetch();
            if (guilds.size == 0) {
                logger.error("The bot is not running in any guild!");
                process.exit(1);
            }
            const guildIds = guilds.map((_, id) => (id));
            const guildNames = guilds.map(guild => guild.name);
            const fetchServerPromise = guildIds.map((value) => (fetchServer({ guildId: value })));
            const serverResult = await Promise.all(fetchServerPromise);
            let cache = {};
            let serverToBeUpdated = [];

            serverResult.forEach((value, index) => {
                if (value[1]){
                    table.addRow(`${guildNames[index]} admin`, `❌ Error: ${value[1]}`);
                    errorFlag = true;
                }else{
                    table.addRow(`${guildNames[index]} admin`, `✅ Fetched and cached`);
                    if (value[0].length == 0){
                        //to-do upload this part when we allow multiple sercerUpload
                        const empty = {
                            adminID: [],
                            adminRoles: [],
                            adminCommands: []
                        };
                        cache[guildIds[index]] = empty;
                        serverToBeUpdated.push(updateServer({
                            ...empty,
                            guildId: guildIds[index],
                            guildName: guildNames[index]
                        }))
                    //Caution: 
                    }else cache[guildIds[index]] = value[0][0];
                }
            })

            const serverUpdateResults = await Promise.all(serverToBeUpdated);
            for (const updateResult of serverUpdateResults){
                if (updateResult[1]){
                    logger.error("Updating Server Admin Data Error!");
                    logger.info(`\n${table.toString()}`);
                    process.exit(1);
                }
            }

            if (errorFlag){
                logger.error("Fetching data error!");
                logger.info(`\n${table.toString()}`);
                process.exit(1);
            }              
            myCache.set("server", cache);
            logger.info(`\n${table.toString()}`);
        }

        await loadCache();

        myCache.on("expired", async(key, value) => {
            switch(key){
                case "projects":
                    await fetchProjects();
                    break;
                case "skills":
                    await fetchSkills();
                    break;
                case "users":
                    await fetchUsers();
                    break;
                case "teams":
                    await fetchTeams();
                    break;
                case "unverifiedSkills":
                    await fetchUnverifiedSkills();
                    break;
            }
        })

        try{
            if (process.env.SLASH_CMD_ENV == "production"){
                //Clear globla commands
                //commands = []
                await rest.put(Routes.applicationCommands(clientId), {
                    //JSON Format
                    body: commands 
                });
                logger.info("Commands are set globally");
            }else{
                let guild = client.guilds.cache.get(process.env.GUILDID);
                if (!guild) {
                    guild = await client.guilds.fetch(process.env.GUILDID);
                    if (!guild){
                        logger.error("Cannot find this guild");
                        process.exit(1);
                    }
                }
                await guild.members.fetch();
                await guild.channels.fetch();
                //Clear local commands
                //commands = []
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