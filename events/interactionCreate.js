const {MessageComponentInteraction, CommandInteraction} = require("discord.js");
const logger = require("../helper/logger");
require("dotenv").config();

module.exports = {
    name: "interactionCreate",
    once: false,
    
    /**
     * @param  {CommandInteraction | MessageComponentInteraction} interaction
     */
    async execute (interaction){
        //interaction => CommandInteraction
        if (interaction.isCommand()){
            //Get command object through the property of interaction, coomandName
            const command = interaction.client.commands.get(interaction.commandName);
        
            //TODO Need to handle this error
            if (!command) return;
        
            try{
                await command.execute(interaction);
            }catch (err){
                if (interaction.deferred){
                    interaction.editReply("Unknown error occurs, please contact admins.")
                }
                //No need to stop the bot
                return logger.error(`User: ${interaction.user.username} Error: ${err.name} occurs when executing ${interaction.commandName} command. Msg: ${err.message} Stack: ${err.stack}`);
            }
        }


    }
}