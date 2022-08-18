const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const instructionFile = require("../helpInstruction.json");

module.exports = {
    commandName: "help",
    description: "Bot help command",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        
        const commandNames = (await interaction.client.application.commands.fetch()).map((value) => value.name);
        const start = "Here,s an overiew of all the Eden Commands\n\n";
        let personalCommandInstruction = "**Person-commands**\n\n";
        let projectCommanInstruction = "**Project-commands**\n\n";
        commandNames.forEach((commandName) => {
            const personalCommands = instructionFile.PersonalCommand[commandName];
            const projectCommands = instructionFile.ProjectCommand[commandName];
            let personalTmp = '', projectTmp = '';
            if (personalCommands){
                personalTmp = personalCommands.reduce((pre, cur) => {
                    return cur.name + cur.instruction + pre
                }, personalTmp)
            }
            if (projectCommands){
                projectTmp = projectCommands.reduce((pre, cur) => {
                    return cur.name + cur.instruction + pre
                }, projectTmp)
            }
            personalCommandInstruction += personalTmp;
            projectCommanInstruction += projectTmp;
        });
        personalCommandInstruction += "\n";
        projectCommanInstruction += "\n"
        const replyEmbed = new MessageEmbed()
            .setTitle("Eden 🌳 project/person match commands")
            .setDescription(start + personalCommandInstruction + projectCommanInstruction);
        return interaction.reply({
            embeds: [
                replyEmbed
            ],
            ephemeral: true
        })
    }

}