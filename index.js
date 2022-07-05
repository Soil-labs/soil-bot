const discord = require('discord.js');
const fs = require("fs");
const path = require('path')
const myCache = require('./helper/cache')
require("dotenv").config();

//Intents mean the functionality of your bot
const client = new discord.Client({ intents: [
    discord.Intents.FLAGS.GUILDS, 
    discord.Intents.FLAGS.GUILD_MESSAGES,
    discord.Intents.FLAGS.GUILD_MEMBERS,
    discord.Intents.FLAGS.GUILD_PRESENCES,
    discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS
]});

client.commands = new discord.Collection();
client.auto = new discord.Collection();

const slashCommandFilesPath = path.join(process.cwd(), "slashcommands");
const slashCommandFiles = fs.readdirSync(slashCommandFilesPath).filter((file) => file.endsWith(".js"));
const slashCommands = [];

//Load command
for (const file of slashCommandFiles){
    const command = require(path.join(slashCommandFilesPath, file));
    command.generateData();
    slashCommands.push(command.data.toJSON());
    //Create a set pair, (commandName, commandPackage), very usefull in events
    client.commands.set(command.data.name, command);
}

//Load autoComplete
const autoCompleteFilesPath = path.join(process.cwd(), 'autocomplete');
const autoCompleteFiles = fs.readdirSync(autoCompleteFilesPath).filter((file) => file.endsWith(".js"))

for (const file of autoCompleteFiles){
    const auto = require(path.join(autoCompleteFilesPath, file));
    for (const command of auto.attachedCommand){
        if (auto.options.length == 0) continue;
        for (const option of auto.options){
            client.auto.set(`${command}${option}`, auto)
        }
    }
}

const eventsFilesPath = path.join(process.cwd(), "events");
const eventsFiles = fs.readdirSync(eventsFilesPath).filter((file) => file.endsWith(".js"));

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
