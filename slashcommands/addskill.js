const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, User } = require("discord.js");
const myCache = require('../helper/cache');
const { addSkillToMember, addSkill, updateUser } = require('../helper/graphql');
const {awaitWrap, validSkill, validUser} = require("../helper/util")
require("dotenv").config()

module.exports = {
    commandName: "skill",
    description: "Skill someone",

    data: null,
    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addUserOption(option =>
                option.setName("user")
                    .setDescription("The member you'd like to support")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("skill")
                    .setDescription("Choose a skill from the list or create a new one")
                    .setRequired(true)
                    .setAutocomplete(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        let skill = interaction.options.getString('skill');

        await interaction.deferReply({
            ephemeral: true
        })

        if (user.bot) return interaction.followUp({
            content: `Sorry, you cannot support a bot.`
        })

        if (!validUser(interaction.user.id)) {
            const authorOnboardResult = await this.onboardNewUser(interaction.user);
            if (authorOnboardResult.error) return interaction.followUp({
                content: `Error occured when onboarding you: \`${authorOnboardResult.message}\``,
                ephemeral: true
            });
            const authorDMchannel = await interaction.user.createDM();
            const {authorDMresult ,authorDMerror} = await awaitWrap(authorDMchannel.send({
                content: `Hi, ${interaction.user.username}! Please use this [link](https://www.google.com/) to verify yourself`
            }), "authorDMresult", "authorDMerror");
            if (authorDMerror) await interaction.followUp({
                content: "Cannot DM you! Please use this [link](https://www.google.com/) to verify yourself",
                ephemeral: true
            })
        }

        if (!validUser(user.id)) {
            const userOnboardResult = await this.onboardNewUser(user);
            if (userOnboardResult.error) return interaction.followUp({
                content: `Error occured when onboarding ${user.username}: \`${userOnboardResult.message}\``,
                ephemeral: true
            });
            const userDMchannel = await user.createDM()
            const {userDMresult ,userDMerror} = await awaitWrap(userDMchannel.send({
                content: `Hi, ${user.username}! Please use this [link](https://www.google.com/) to verify yourself`
            }), "userDMresult", "userDMerror");
            if (userDMerror){
                await interaction.channel.send({
                    content: `<@${user.id}>, I cannot DM you! Please use this [link](https://www.google.com/) to verify yourself`
                })
            }else{
                await interaction.followUp({
                    content: `Onboarding verification link has been DM to ${user.username}`,
                    ephemeral: true
                });
            }
        }

        if (!validSkill(skill)){
            //In this case, skill is the name of this skill, not a skillID for Database
            await interaction.followUp({
                content: "Creating a new skill for you...",
                ephemeral: true
            })

            const [newSkill, newSkillError] = await addSkill({ tagName: skill });
            if (newSkillError) return interaction.followUp({
                content: `Error occured when creating new skill \`${skill}\`: \`${newSkillError.response.errors[0].message}\``,
                ephemeral: true
            })

            await interaction.followUp({
                content: `A new skill \`${skill}\` has been created.`,
                ephemeral: true
            })
            myCache.set("skills", [
                ...myCache.get("skills"),
                {
                    _id: newSkill._id,
                    tagName: skill
                }
            ]);
            //Fetch the skillID from the Database
            skill = newSkill._id;
        }

        const [result, error] = await addSkillToMember(
            {
                skillID: skill,
                memberID: user.id,
                authorID: interaction.user.id
            }
        );

        if (error) return interaction.followUp({
            content: `Error occured when add skill to ${user.username}: \`${error.response.errors[0].message}\``,
            ephemeral: true
        })

        const DMchannel = await user.createDM();
        const skillResult = validSkill(skill);
        const {DMresult ,DMerror} = await awaitWrap(DMchannel.send({
            content: `${interaction.member.displayName} skilled you with \`${skillResult.tagName ?? "No skill name"}\``
        }), "DMresult", "DMerror");

        if (skillResult){
            if (DMerror){
                interaction.channel.send({
                    content: `<@${user.id}>: I cannot DM you.\n${interaction.member.displayName} just skilled you with \`${skillResult.tagName ?? "No skill name"}\`!`
                })
                return interaction.followUp({
                    content: `Broadcast has been sent to the channel <#${interaction.channel.id}>.`,
                    ephemeral: true
                })
            }
            else return interaction.followUp({
                content: `DM is sent. Skill ${user.username} with ${skillResult.tagName ?? "No skill name"} successfully!`,
                ephemeral: true
            })
        }else return interaction.followUp({
            content: "Sorry, skill you chose is not valid, but you have skilled this user successfully. ",
            ephemeral: true
        })
    },
    /**
     * @param  {User} user
     */
    async onboardNewUser(user){

        const userInform = {
            _id: user.id,
            discordName: user.username,
            discriminator: user.discriminator,
            discordAvatar: user.displayAvatarURL({ format: 'jpg' })
        }

        const [result, error] = await updateUser(userInform);

        if (error) return {
            error: true,
            message: error.response.errors[0].message
        }

        myCache.set("users", [ ...myCache.get("users"), userInform ])
        
        return {
            error: false
        }
    }

}