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
        const command = interaction.options.getSubcommand();
        const cached = myCache.get("server");
        if (command == "read"){
            let adminUsersField = '', adminRolesField = '', adminCmdsField= '';
            const { adminID, adminRoles, adminCommands } = cached;
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
                if (cached.adminRoles.includes(role.id)) return interaction.reply({
                    content: `\`${role.name}\` has been added to the admin group`,
                })
                adminRoles = [...cached.adminRoles, role.id];
                successReply = `\`${role.name}\` has been added to the admin group`;
            }else{
                const roleId = interaction.options.getString("role");
                if (!cached.adminRoles.includes(roleId)) return interaction.reply({
                    content: "Please check your input, the role you chose is not in the list",
                });
                adminRoles = cached.adminRoles.filter(value => value != roleId)
                const roleObj = interaction.guild.roles.cache.get(roleId);
                successReply = `\`${roleObj.name}\` has been removed from the admin group`;
            }
            data = {
                ...cached,
                adminRoles: adminRoles
            }
        }

        if (group == "member"){
            let adminID;
            if (command == "add") {
                const user = interaction.options.getUser("user");
                if (cached.adminID.includes(user.id)) return interaction.reply({
                    content: `\`${user.username}\` has been added to the admin group`,
                })
                adminID = [...cached.adminID, user.id];
                successReply = `\`${user.username}\` has been added to the admin group`;
            }else{
                const userId = interaction.options.getString("user");
                if (!cached.adminID.includes(userId)) return interaction.reply({
                    content: "Please check your input, the role you chose is not in the list",
                });
                adminID = cached.adminID.filter(value => value != userId);
                const memberObj = interaction.guild.members.cache.get(userId);
                successReply = `\`${memberObj.displayName}\` has been removed from the admin group`;
            }
            data = {
                ...cached,
                adminID: adminID
            }
        }

        if (group == "command"){
            const commandName = interaction.options.getString("command");
            let adminCommands;
            if (command == "add") {
                if (cached.adminCommands.includes(commandName)) return interaction.reply({
                    content: `\`${commandName}\` has been added to the admin group`,
                })
                adminCommands = [...cached.adminCommands, commandName];
                successReply = `\`${commandName}\` has been added to the admin group`;
            }else{
                if (!cached.adminCommands.includes(commandName)) return interaction.reply({
                    content: "Please check your input, the role you chose is not in the list",
                });
                adminCommands = cached.adminCommands.filter(value => value != commandName);
                successReply = `\`${commandName}\` has been removed from the admin group`;
            }
            data = {
                ...cached,
                adminCommands: adminCommands
            }
        }

        await interaction.deferReply({ ephemeral:true });
        const [ result, error ] = await updateServer({
            ...data,
            guildId: interaction.guild.id,
            guildName: interaction.guild.name
        })

        if (error) return interaction.followUp({
            content: `Error occured when updloading: \`${error}\``,
        })
        myCache.set("server", data);

        return interaction.followUp({
            content: successReply
        })

    }

}