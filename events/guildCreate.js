const { Guild } = require("discord.js");
const myCache = require("../helper/cache");
const { updateServer } = require("../helper/graphql");
const logger = require("../helper/logger");

module.exports = {
    name: "guildCreate",
    once: false,
    /**
     * @param  {Guild} guild
     */
    async execute(guild) {
        console.log(1)
        if (guild.available){
            console.log(1)
            const guildPermissionInform = {
                adminID: [],
                adminRoles: [],
                adminCommands: []
            };
            let cached;
            if (myCache.has("server")){
                cached = {
                    ...myCache.get("server"),
                    [guild.id]: guildPermissionInform
                }
            }else cached[guild.id] = guildPermissionInform;

            const [result, error] = await updateServer({
                guildId: guild.id,
                guildName: guild.name,
                ...guildPermissionInform
            });

            if (error) return logger.error(`${guild.name} was created, but cannot upload its permission information. Reason: ${error}`);

            myCache.set("server", cached);
            console.log(myCache.get("server"))
        }
    }
}