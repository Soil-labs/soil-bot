const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, MessageEmbed } = require("discord.js");
const { initializeApp, getApp } = require('firebase/app')
const { getFirestore, getDocs, query, collection, writeBatch, doc } = require("firebase/firestore");
const { fetchProjects, fetchSkills, fetchUsers, fetchUnverifiedSkills, fetchTeams, fetchServer, updateServer, fetchRoles, projectTeamRole } = require("../helper/graphql");
const { awaitWrap, getCurrentTimeInSec, getNextBirthday, checkChannelSendPermission } = require('../helper/util');

const myCache = require("../helper/cache")
const logger = require("../helper/logger");
const AsciiTable = require('ascii-table/ascii-table');
const CONSTANT = require("../helper/const");

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

        const loadCache = async() => {
            const table = new AsciiTable("Cache Loading ...");
            table.setHeading("Data", "Status");

            const results = await Promise.all([
                fetchProjects(),
                fetchSkills(),
                fetchUnverifiedSkills(),
                fetchUsers(),
            ]);
            const items = ["Project", "Skills", "Unverified Skills", "Users"];
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

            // to-do fetch birthday
            const app = initializeApp({
                projectId: process.env.PROJECT_ID,
            });
            const db = getFirestore(app);
            const birthdayQuery = query(collection(db, "Birthday"));
            const {result: birthdaySnaps, error} = await awaitWrap(getDocs(birthdayQuery));
            if (error) {
                table.addRow("Birthday", `❌ Error: ${error.message}`);
                errorFlag = true;
            }else{
                let birthdays = {};
                if (birthdaySnaps.size != 0) {
                    birthdaySnaps.forEach((userSnap) => {
                        birthdays[userSnap.id] = userSnap.data();
                    })
                }
                myCache.set("birthday", birthdays, CONSTANT.NUMERICAL_VALUE.BIRTHDAY_CHECK_INTERVAL);
                table.addRow("Birthday", "✅ Fetched and cached");
            }
            
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
            myCache.set("gardenContext", {});
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
                case "unverifiedSkills":
                    await fetchUnverifiedSkills();
                    break;
                case "birthday":
                    let soilTeamGuild = client.guilds.cache.get("996558082098339953");
                    if (!soilTeamGuild) {
                        const { result: fetchGuildResult, error: fetchGuildError } = await awaitWrap(client.guilds.fetch("996558082098339953"));
                        if (fetchGuildError) {
                            return myCache.set("birthday", value, CONSTANT.NUMERICAL_VALUE.BIRTHDAY_CHECK_INTERVAL);
                        }
                        soilTeamGuild = fetchGuildResult;
                    }
                    let targetChannel = soilTeamGuild.channels.cache.get("1005520465638477824");
                    if (!targetChannel) {
                        const { result: fetchChannelResult, error: fetchChannelError } = await awaitWrap(soilTeamGuild.channels.fetch("1005520465638477824"));
                        if (fetchChannelError) {
                            return myCache.set("birthday", value, CONSTANT.NUMERICAL_VALUE.BIRTHDAY_CHECK_INTERVAL);
                        }
                        targetChannel = fetchChannelResult;
                    }
                    const current = getCurrentTimeInSec();
                    const celebratePromise = [];
                    let newCache = value;
                    const firestore = getFirestore(getApp());
                    const batch = writeBatch(firestore);
                    Object.keys(value).forEach((userId) => {
                        const { date, month, day, offset } = value[userId];
                        const member = soilTeamGuild.members.cache.get(userId);
                        if (!member) return;
                        if (current > date) {
                            const toBecached = {
                                ...value[userId],
                                date: getNextBirthday(month, day, offset)
                            }
                            celebratePromise.push(
                                targetChannel.send({
                                    content: `<@${userId}>, today is your birthday! Enjoy your day!`,
                                    embeds: [
                                        new MessageEmbed()
                                            .setAuthor({ name: `@${member.displayName}`, iconURL: member.user.avatarURL() })
                                            .setTitle("Happy Birthday!🥳")
                                            .setDescription(`Next Birthday: <t:${toBecached.date}>`)
                                    ]
                                })
                            )
                            batch.set(doc(firestore, 'Birthday', userId), toBecached);
                            newCache[userId] = toBecached;
                        }
                    });
                    if (celebratePromise.length == 0) {
                        return myCache.set("birthday", value, CONSTANT.NUMERICAL_VALUE.BIRTHDAY_CHECK_INTERVAL);
                    };
                    await batch.commit();
                    myCache.set("birthday", newCache, CONSTANT.NUMERICAL_VALUE.BIRTHDAY_CHECK_INTERVAL);
                    if (checkChannelSendPermission(targetChannel, soilTeamGuild.me.id)){
                        await Promise.all(celebratePromise);
                    }
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
                // commands = []
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