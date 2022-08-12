const { Guild } = require("discord.js");
const myCache = require("../helper/cache");
const { updateServer } = require("../helper/graphql");
const logger = require("../helper/logger");

module.exports = {
    name: "guildDelete",
    once: false,
    /**
     * @param  {Guild} guild
     */
    async execute(guild) {
        console.log(1)
        if (guild.available){
            let cached;
            if (myCache.has("server")){
                cached = myCache.get("server");
                delete cached[guild.id];
                myCache.set("server", cached);
            }

            const [result, error] = await updateServer({
                guildId: guild.id,
                guildName: guild.name,
                adminID: [],
                adminRoles: [],
                adminCommands: []
            });

            if (error) return logger.error(`${guild.name} was deleted, but cannot upload its permission information. Reason: ${error}`);
            console.log(myCache.get("server"))
        }
    }
}