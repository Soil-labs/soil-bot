const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const myCache = require("../helper/cache");
const { updateServer } = require('../helper/graphql');


module.exports = {
    commandName: "admin",
    description: "Set Soil",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addSubcommandGroup(group =>
                group.setName("role")
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
                group.setName("member")
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
                group.setName("command")
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
            .addSubcommand(command =>
                command.setName("read")
                    .setDescription("Read current settings"))
            
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        //to-do when admin and adminRole is empty and you want to add `admin cmd` as an admin command, the bot gives a warning
        const command = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;
        if (!myCache.has("server") || !myCache.get("server")[guildId]) return interaction.reply({
            content: "Cannot find server admin information, please contact admin.",
            ephemeral: true
        })
        const cachedGuildsAdmin = myCache.get("server");
        const cachedGuildAdmin = cachedGuildsAdmin[guildId];
        if (command == "read"){
            let adminUsersField = '', adminRolesField = '', adminCmdsField= '';
            const { adminID, adminRoles, adminCommands } = cachedGuildAdmin;
            [adminID, adminRoles, adminCommands].forEach((value, index) => {
                if (index == 0){
                    if (value.length == 0) adminUsersField = '> -';
                    else value.forEach((memberId) => {
                        adminUsersField += `> <@${memberId}>\n`;
                    })
                }else if (index == 1){
                    if (value.length == 0) adminRolesField = '> -';
                    else value.forEach((roleId) => {
                        adminRolesField += `> <@&${roleId}>\n`;
                    })
                }else{
                    if (value.length == 0) adminCmdsField = '> -';
                    else value.forEach((commandName) => {
                        adminCmdsField += `> \`${commandName}\`\n`;
                    })
                }
            });
            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle(`${interaction.guild.name} Permission Dashboard`)
                        .addFields([
                            {
                                name: "Admin User",
                                value: adminUsersField,
                                inline: true
                            },
                            {
                                name: "Admin Role",
                                value: adminRolesField,
                                inline: true
                            },
                            {
                                name: "Admin Command",
                                value: adminCmdsField,
                                inline: true
                            }
                        ])
                ],
                ephemeral: true
            })
        }

        const group = interaction.options.getSubcommandGroup();
        let data, successReply;

        if (group == "role"){
            let adminRoles;
            if (command == "add") {
                const role = interaction.options.getRole("role");
                if (cachedGuildAdmin.adminRoles.includes(role.id)) return interaction.reply({
                    content: `\`${role.name}\` has been added to the admin group`,
                    ephemeral: true
                })
                adminRoles = [...cachedGuildAdmin.adminRoles, role.id];
                successReply = `\`${role.name}\` has been added to the admin group`;
            }else{
                const roleId = interaction.options.getString("role");
                if (!cachedGuildAdmin.adminRoles.includes(roleId)) return interaction.reply({
                    content: "Please check your input, the role you chose is not in the list",
                    ephemeral: true
                });
                adminRoles = cachedGuildAdmin.adminRoles.filter(value => value != roleId)
                const roleObj = interaction.guild.roles.cache.get(roleId);
                successReply = `\`${roleObj.name}\` has been removed from the admin group`;
            }
            data = {
                ...cachedGuildAdmin,
                adminRoles: adminRoles
            }
        }

        if (group == "member"){
            let adminID;
            if (command == "add") {
                const user = interaction.options.getUser("user");
                if (cachedGuildAdmin.adminID.includes(user.id)) return interaction.reply({
                    content: `\`${user.username}\` has been added to the admin group`,
                    ephemeral: true
                })
                adminID = [...cachedGuildAdmin.adminID, user.id];
                successReply = `\`${user.username}\` has been added to the admin group`;
            }else{
                const userId = interaction.options.getString("user");
                if (!cachedGuildAdmin.adminID.includes(userId)) return interaction.reply({
                    content: "Please check your input, the role you chose is not in the list",
                    ephemeral: true
                });
                adminID = cachedGuildAdmin.adminID.filter(value => value != userId);
                const memberObj = interaction.guild.members.cache.get(userId);
                successReply = `\`${memberObj.displayName}\` has been removed from the admin group`;
            }
            data = {
                ...cachedGuildAdmin,
                adminID: adminID
            }
        }

        if (group == "command"){
            const commandName = interaction.options.getString("command");
            let adminCommands;
            if (command == "add") {
                if (cachedGuildAdmin.adminCommands.includes(commandName)) return interaction.reply({
                    content: `\`${commandName}\` has been added to the admin group`,
                    ephemeral: true
                })
                adminCommands = [...cachedGuildAdmin.adminCommands, commandName];
                successReply = `\`${commandName}\` has been added to the admin group`;
            }else{
                if (!cachedGuildAdmin.adminCommands.includes(commandName)) return interaction.reply({
                    content: "Please check your input, the role you chose is not in the list",
                    ephemeral: true
                });
                adminCommands = cachedGuildAdmin.adminCommands.filter(value => value != commandName);
                successReply = `\`${commandName}\` has been removed from the admin group`;
            }
            data = {
                ...cachedGuildAdmin,
                adminCommands: adminCommands
            }
        }

        await interaction.deferReply({ ephemeral:true });
        const [ result, error ] = await updateServer({
            ...data,
            guildId: guildId,
            guildName: interaction.guild.name
        })

        if (error) return interaction.followUp({
            content: `Error occured when updloading: \`${error}\``,
        });

        myCache.set("server", {
            ...cachedGuildsAdmin,
            [guildId]: data
        });

        return interaction.followUp({
            content: successReply
        })

    }

}