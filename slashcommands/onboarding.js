const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");
const { updateUser } = require("../helper/graphql")
const myCache = require("../helper/cache");
require("dotenv").config()

module.exports = {
    commandName: "onboarding",
    description: "Onboard a newcomer",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addUserOption(option =>
                option.setName("user")
                    .setDescription("The member you'd like to support")
                    .setRequired(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        if (user.bot) return interaction.reply({
            content: "Sorry, you cannot choose a bot as a target."
        })
        const userInform = {
            _id: user.id,
            discordName: "BlueAlex123237",
            discriminator: user.discriminator,
            discordAvatar: user.displayAvatarURL({ format: 'jpg' })
        }
        await interaction.deferReply()
        const [result, error] = await updateUser(userInform);

        if (error) return interaction.followUp({
            content: `Error occured: \`${error.response.errors[0].message}\``
        })
        const updateCache = myCache.get("users").filter(value => value._id == user.id);
        if (updateCache.length == 0){
            myCache.set("users", [ ...myCache.get("users"), userInform ])
        }else{
            //length == 1
            const tmp = myCache.get("users")
            tmp.splice(tmp.indexOf(updateCache[0]), 1, userInform);
            myCache.set("users", tmp)
        }
        
        return interaction.followUp({
            content: `${user.username} has been onboarded.`
        })
    }

}