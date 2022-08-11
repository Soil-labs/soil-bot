const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require("discord.js");
const myCache = require("../helper/cache");
const _ = require("lodash");
const { updateUser } = require('../helper/graphql');
const { awaitWrap } = require('../helper/util');


module.exports = {
    commandName: "set",
    description: "Set Soil",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addSubcommandGroup(group =>
                group.setName("admin_role")
                    .setDescription("Moderate admin role")
                    .addSubcommand(command =>
                        command.setName("add")
                            .setDescription("Add an admin role")
                            .addRoleOption(option =>
                                option.setName("role")
                                    .setDescription("Choose the role as an admin one")
                                    .setRequired(true)))
                    .addSubcommand(command =>
                        command.setName("remove")
                            .setDescription("Remove an admin role")
                            .addStringOption(option =>
                                option.setName("role")
                                    .setDescription("Choose the role you'd like to remove from the whitelist")
                                    .setAutocomplete(true)
                                    .setRequired(true)))
            )   
            .addSubcommandGroup(group =>
                group.setName("admin_member")
                    .setDescription("Moderate admin member")
                    .addSubcommand(command =>
                        command.setName("add")
                            .setDescription("Add an admin member")
                            .addUserOption(option =>
                                option.setName("user")
                                    .setDescription("Choose a member")
                                    .setRequired(true)))
                    .addSubcommand(command =>
                        command.setName("remove")
                            .setDescription("Remove an admin member")
                            .addStringOption(option =>
                                option.setName("user")
                                    .setDescription("Choose the member you'd like to remove from the whitelist")
                                    .setAutocomplete(true)
                                    .setRequired(true)))
            )

            .addSubcommandGroup(group =>
                group.setName("admin_command")
                    .setDescription("Moderate admin command")
                    .addSubcommand(command =>
                        command.setName("add")
                            .setDescription("Add an admin member")
                            .addStringOption(option =>
                                option.setName("command")
                                    .setDescription("Choose a command")
                                    .setRequired(true)))
                    .addSubcommand(command =>
                        command.setName("remove")
                            .setDescription("Remove an admin command")
                            .addStringOption(option =>
                                option.setName("command")
                                    .setDescription("Choose the command you'd like to remove from the whitelist")
                                    .setAutocomplete(true)
                                    .setRequired(true)))
            )
            
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const group = interaction.options.getSubcommandGroup();
        const command = interaction.options.getSubcommand();
        const cached = myCache.get("team");

        if (group == "admin_role"){
            const role = interaction.options.getRole("role");
            let successReply, adminRoles;
            if (command == "add") {
                if (cached.adminRoles.includes(role.id)) return interaction.reply({
                    content: `${role.name} has been added to the admin group`,
                })
                adminRoles = [...cached.adminRoles, role.id];
                successReply = `${role.name} has been added to the admin group`;
            }else{
                if (!cached.adminRoles.includes(role)) return interaction.reply({
                    content: "Please check your input, the role you chose is not in the list",
                });
                adminRoles = cached.adminRoles.filter(value => value != role)
                const roleObj = interaction.guild.roles.cache.get(role);
                successReply = `${roleObj.name} has been removed from the admin group`;
            }

            await interaction.deferReply({ ephemeral:true });
            const data = {
                ...cached,
                adminRoles: adminRoles
            }
            const [ result, error ] = await updateUser({
                ...data,
                guildId: interaction.guild.id,
                guildName: interaction.guild.name
            })

            if (error) return interaction.followUp({
                content: `Error occured when updloading: \`${error}\``,
            })
            myCache.set("team", data);

            return interaction.followUp({
                content: successReply
            })
        }

        if (group == "admin_member"){
            const user = interaction.options.getUser("user");
            let successReply, adminID;
            if (command == "add") {
                if (cached.adminID.includes(user.id)) return interaction.reply({
                    content: `${user.username} has been added to the admin group`,
                })
                adminID = [...cached.adminID, user.id];
                successReply = `${user.username} has been added to the admin group`;
            }else{
                if (!cached.adminID.includes(user)) return interaction.reply({
                    content: "Please check your input, the role you chose is not in the list",
                });
                adminID = cached.adminID.filter(value => value != user);
                const memberObj = interaction.guild.members.cache.get(user);
                successReply = `${memberObj.displayName} has been removed from the admin group`;
            }
            await interaction.deferReply({ ephemeral:true });
            const data = {
                ...cached,
                adminID: adminID
            }
            const [ result, error ] = await updateUser({
                ...data,
                guildId: interaction.guild.id,
                guildName: interaction.guild.name
            })

            if (error) return interaction.followUp({
                content: `Error occured when updloading: \`${error}\``,
            })

            myCache.set("team", data);

            return interaction.followUp({
                content: successReply
            })
        }

        if (group == "admin_command"){
            const commandName = interaction.options.getString("command");

            return interaction.reply({  
                content: "1",
                ephemeral: true
            })
            console.log()

            if (command == "add") {

            }else{
                
            }
        }

    }

}