const {MessageComponentInteraction, CommandInteraction} = require("discord.js");
const myCache = require("../helper/cache");
const logger = require("../helper/logger");
const _ = require("lodash")

module.exports = {
    name: "interactionCreate",
    once: false,
    
    /**
     * @param  {CommandInteraction | MessageComponentInteraction} interaction
     */
    async execute (interaction){
        
        if (interaction.isCommand()){

            const command = interaction.client.commands.get(interaction.commandName);
        
            //TODO Need to handle this error
            if (!command) return;

            if (myCache.has("server")){
                const { commandName, member } = interaction;
                const { adminID, adminRoles, adminCommands } = myCache.get("server");
                if (adminCommands.includes(commandName)){
                    if (
                        !adminID.includes(member.id)
                        && _.intersection(Array.from(member.roles.cache.keys()), adminRoles).length == 0
                    ) return interaction.reply({
                        content: "Sorry, you don't have permission to run this command.",
                        ephemeral: true
                    })
                }
            }
            
            try{
                await command.execute(interaction);
            }catch (err){
                if (interaction.deferred){
                    interaction.editReply({
                        content: "Unknown error occurs, please contact admins.",
                        components: [],
                        button: []
                    });
                }
                return logger.error(`User: ${interaction.user.username} Error: ${err.name} occurs when executing ${interaction.commandName} command. Msg: ${err.message} Stack: ${err.stack}`);
            }
        }

        if(interaction.isButton()){

            const button = interaction.client.buttons.get(interaction.customId)

            if(!button) return;

            try{
                await button.execute(interaction);
            }catch(err){
                //console.error(err)
                return logger.error(`User: ${interaction.user.username} Error: ${err.name} occurs when interacting ${interaction.customId} button. Msg: ${err.message} Stack: ${err.stack}`);
            }
        }

        if (interaction.isAutocomplete()){
            const option = interaction.options.getFocused(true).name;
            const command = interaction.client.auto.get(`${interaction.commandName}${option}`);

            if (!command || !option) return;

            try {
                await command.execute(interaction);
            } catch (err) {
                return logger.error(`User: ${interaction.user.username} Error: ${err.name} occurs when executing ${interaction.commandName} command. Msg: ${err.message} Stack: ${err.stack}`);
            }
        }


    }
}