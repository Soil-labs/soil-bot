const discord = require('discord.js');
const fs = require("fs");
const path = require('path');
require('dotenv').config();

//Intents mean the functionality of your bot
const client = new discord.Client({ intents: [
    discord.Intents.FLAGS.GUILDS, 
    discord.Intents.FLAGS.GUILD_MESSAGES,
    discord.Intents.FLAGS.GUILD_MEMBERS,
    discord.Intents.FLAGS.GUILD_PRESENCES,
    discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    discord.Intents.FLAGS.GUILD_VOICE_STATES
]});

client.commands = new discord.Collection();
client.auto = new discord.Collection();
client.buttons = new discord.Collection();

const slashCommandFilesPath = path.join(process.cwd(), "slashcommands");
const slashCommandFiles = fs.readdirSync(slashCommandFilesPath).filter((file) => file.endsWith(".js"));
let slashCommands = [];

//Load command
for (const file of slashCommandFiles){
    const command = require(path.join(slashCommandFilesPath, file));
    command.generateData();
    slashCommands.push(command.data.toJSON());
    //Create a set pair, (commandName, commandPackage), very usefull in events
    client.commands.set(command.data.name, command);
}

//Stupid not flexible way to add choices to command `/set admin_command add`
const choices = slashCommands.map(value => ({
    name: value.name,
    value: value.name
}));
const commandIndex = slashCommands.findIndex((value) => (value.name == "admin"));
if (commandIndex != -1){
    //console.log(slashCommands[commandIndex].options[2].options[0].options[0])
    slashCommands[commandIndex].options[2].options[0].options[0].choices = choices
}

//Load autoComplete
const autoCompleteFilesPath = path.join(process.cwd(), 'autocompletes');
const autoCompleteFiles = fs.readdirSync(autoCompleteFilesPath).filter((file) => file.endsWith(".js"))

for (const file of autoCompleteFiles){
    const auto = require(path.join(autoCompleteFilesPath, file));
    for (const match of auto.match){
        //to-do shall we add subcommandgroup?
        //CommandName + SubCommandName(optional) + optionName
        const keyName = match.reduce((pre, cur) => {
            return pre + cur
        }, '')
        client.auto.set(keyName, auto);
    }
}

const buttonFilesPath = path.join(process.cwd(), "buttons");
const buttonFiles = fs.readdirSync(buttonFilesPath).filter((file) => file.endsWith(".js"));

//Load button
for (const file of buttonFiles){
    const button = require(path.join(buttonFilesPath, file));
    //Our self-defined customId is an array
    for(const id of button.customId){
        client.buttons.set(id, button);
    }
}

const eventsFilesPath = path.join(process.cwd(), "events");
const eventsFiles = fs.readdirSync(eventsFilesPath).filter((file) => file.endsWith(".js"));

if (process.env.SLASH_CMD_ENV == "production" && process.env.ALLOW_COMMAND != "allCommand"){
    const filtedCommands = process.env.ALLOW_COMMAND.split(',').filter((value) => value != '');
    if (filtedCommands.length == 0){
        logger.error("Please set ALLOW_COMMAND in .env or check its format");
        process.exit(1);
    }else{
        slashCommands = slashCommands.filter((value) => filtedCommands.includes(value.name))
    }
}

//Loop event
for (const file of eventsFiles){
    const event = require(path.join(eventsFilesPath, file));
    if (event.once){
        //Check specific args from Discord API
        client.once(event.name, (...args) => {event.execute(...args, slashCommands)});
    }else{
        client.on(event.name, (...args) => {event.execute(...args)});
    }
}

client.login(process.env.TOKEN);
