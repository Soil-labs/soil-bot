const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, User } = require("discord.js");
const { addSkillToMember, addSkill, updateUser } = require('../helper/graphql');
const {awaitWrap, validSkill, validUser} = require("../helper/util");
const myCache = require('../helper/cache');
const CONSTANT = require("../helper/const");
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
        let skillState = CONSTANT.SKILL_STATE.APPROVED;
        let skillName = '';
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
        const validResult = validSkill(skill);
        if (!validResult){
            //In this case, skill is the name of this skill, not a skillID for Database
            await interaction.followUp({
                content: "Creating a new unverified skill for you...",
                ephemeral: true
            })

            const [unverifiedSkill, unverifiedSkillError] = await addSkill({ name: skill });
            if (unverifiedSkillError) return interaction.followUp({
                content: `Error occured when creating a new unverified skill \`${skill}\`: \`${unverifiedSkillError.response.errors[0].message}\``,
                ephemeral: true
            })

            await interaction.followUp({
                content: `A new unverified skill \`${skill}\` has been created.`,
                ephemeral: true
            })
            myCache.set("unverifiedSkills", [
                ...myCache.get("unverifiedSkills"),
                {
                    _id: unverifiedSkill._id,
                    name: skill
                }
            ]);
            //Fetch the skillID from the Database
            skillName = skill;
            skill = unverifiedSkill._id;
            skillState = CONSTANT.SKILL_STATE.WAITING;
        }else{
            skillName = validResult.name
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

        let dmContent = '';
        let dmErrorContent = '';
        if (skillState == CONSTANT.SKILL_STATE.WAITING){
            dmContent = `${interaction.member.displayName} skilled you with \`${skillName ?? "No skill name"}\`, but this skill is under verification. Once when it is verified, you will see it in your profile.`
            dmErrorContent = `<@${user.id}>: I cannot DM you.\n${interaction.member.displayName} just skilled you with \`${skillName?? "No skill name"}\`. But this skill is under verification. Once when it is verified, you will see it in your profile.`
        }else{
            dmContent = `${interaction.member.displayName} skilled you with \`${skillName ?? "No skill name"}\``;
            dmErrorContent = `<@${user.id}>: I cannot DM you.\n${interaction.member.displayName} just skilled you with \`${skillName ?? "No skill name"}\`!`;
        }

        const DMchannel = await user.createDM();
        const {DMresult ,DMerror} = await awaitWrap(DMchannel.send({
            content: dmContent
        }), "DMresult", "DMerror");
        if (DMerror){
            interaction.channel.send({
                content: dmErrorContent
            })
            return interaction.followUp({
                content: `Broadcast has been sent to the channel <#${interaction.channel.id}>.`,
                ephemeral: true
            })
        }else return interaction.followUp({
            content: `DM is sent. Skill ${user.username} with \`${skillName ?? "No skill name"}\` successfully!`,
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