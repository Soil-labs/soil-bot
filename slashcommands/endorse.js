const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, User, MessageEmbed } = require("discord.js");
const { addSkillToMember, addSkill, addNewMember } = require('../helper/graphql');
const { awaitWrap, validSkill, validUser, updateUserCache } = require("../helper/util");
const myCache = require('../helper/cache');
const CONSTANT = require("../helper/const");
const { sprintf } = require('sprintf-js');

module.exports = {
    commandName: "endorse",
    description: "Endorse someone's skill",

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
        const endorsee = interaction.options.getUser('user');
        const guildId = interaction.guild.id;
        let skill = interaction.options.getString('skill');
        let skillState = CONSTANT.SKILL_STATE.APPROVED;
        let skillName;

        if (endorsee.bot) return interaction.followUp({
            content: `Sorry, you cannot support a bot.`,
            ephemeral: true
        })

        if (endorsee.id == interaction.user.id) return interaction.reply({
            content: "Sorry, you cannot endorse yourself.",
            ephemeral: true
        })

        await interaction.deferReply({
            ephemeral: true
        })

        if (!validUser(interaction.user.id, guildId)) {
            const authorOnboardResult = await this._onboardNewUser(interaction.user, guildId);

            if (authorOnboardResult.error) return interaction.followUp({
                content: `Error occured when onboarding you: \`${authorOnboardResult.message}\``,
                ephemeral: true
            });

            const onboardLink = CONSTANT.LINK.SIGNUP
            await interaction.followUp({
                content: sprintf(CONSTANT.CONTENT.ONBOARD, { onboardLink: onboardLink }),
                ephemeral: true
            })
        }

        const isNewMember = validUser(endorsee.id, guildId) ? false : true
        if (isNewMember) {
            const userOnboardResult = await this._onboardNewUser(endorsee, guildId);
            if (userOnboardResult.error) return interaction.followUp({
                content: `Error occured when onboarding ${endorsee.username}: \`${userOnboardResult.message}\``,
                ephemeral: true
            });

            const userOnboardLink = CONSTANT.LINK.SIGNUP;
            const userDMchannel = await endorsee.createDM();
            const {userDMresult ,userDMerror} = await awaitWrap(userDMchannel.send({
                content: sprintf(CONSTANT.CONTENT.INVITE_DM, {
                    inviterName: interaction.member.displayName,
                    onboardLink: userOnboardLink
                })
            }), "userDMresult", "userDMerror");

            if (userDMerror){
                const {sendResult, sendError } = await awaitWrap(interaction.channel.send({
                    content: sprintf(CONSTANT.CONTENT.INVITE_DM_FAIL, {
                        inviteeId: endorsee.id,
                        inviterId: interaction.user.id,
                        onboardLink: userOnboardLink
                    })
                }), "sendResult", "sendError");
                //to-do
            }else{
                await interaction.followUp({
                    content: sprintf("Onboard DM is sent to \`%s\`", endorsee.username),
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
            if (unverifiedSkillError) return interaction.editReply({
                content: `Error occured when creating a new unverified skill \`${skill}\`: \`${unverifiedSkillError}\``,
                ephemeral: true
            })

            await interaction.followUp({
                content: `A new unverified skill \`${skill}\` has been created.`,
                ephemeral: true
            })
            myCache.set("unverifiedSkills", {
                ...myCache.get("unverifiedSkills"),
                [unverifiedSkill._id]: {
                    name: skill
                }
            });

            skillName = skill;
            skill = unverifiedSkill._id;
            skillState = CONSTANT.SKILL_STATE.WAITING;
        }else{
            //Allow endorse exist skill
            skillName = validResult.name
            // const [userDetail, userDetailError] = await fetchUserDetail({ userID: user.id });
            // if (userDetailError) return interaction.followUp({
            //     content: `Error occured: \`${error.response.errors[0].message}\``,
            // });
            // const skillOverlap = userDetail.skills.filter(value => value._id == skill);
            // if (skillOverlap.length != 0) return interaction.followUp({
            //     content: `Sorry, this user has had this skill \`${skillName}\`.`
            // })
        }

        const [result, error] = await addSkillToMember(
            {
                skillID: skill,
                memberID: endorsee.id,
                authorID: interaction.user.id,
                serverId: [guildId]
            }
        );

        if (error) return interaction.followUp({
            content: `Error occured when add skill to ${endorsee.username}: \`${error}\``,
            ephemeral: true
        })

        const infor = {
            endorseeName: endorsee.username,
            endorseeId: endorsee.id,
            endorserName: interaction.user.username,
            claimEndorsementLink: sprintf(CONSTANT.LINK.CLAIM_ENDORSEMENT, endorsee.id),
            onboardLink: CONSTANT.LINK.SIGNUP,
            endorserEndorsementLink: sprintf(CONSTANT.LINK.ENDORSEMENTS, interaction.user.id)
        }
        const contents = [...this._contents].filter(([condition, content]) => (
            condition.isNewMember == isNewMember && condition.isVerifiedSkill == (skillState == CONSTANT.SKILL_STATE.APPROVED)
        ))
        const { dmContent, dmErrorContent } = contents[0][1](infor);
        const endorserReply = isNewMember ? sprintf(CONSTANT.CONTENT.ENDORSE_NEW_MEMBER_CASE_ENDORSER_REPLY, infor) 
            : sprintf(CONSTANT.CONTENT.ENDORSE_OLD_MEMBER_CASE_ENDORSER_REPLY, infor);

        const DMchannel = await endorsee.createDM();
        const { DMresult ,DMerror } = await awaitWrap(DMchannel.send({
            embeds: [
                new MessageEmbed()
                    .setAuthor({ name: sprintf(dmContent.authorContent, infor), url: infor.endorserEndorsementLink, iconURL: interaction.user.avatarURL() })
                    .setTitle(sprintf(dmContent.title, infor))
                    .setDescription(sprintf(dmContent.description, infor))
                    .setThumbnail(endorsee.avatarURL())
            ]
        }), "DMresult", "DMerror");
        if (DMerror){
            interaction.channel.send({
                content: `<@${interaction.user.id}> <@${endorsee.id}>`,
                embeds: [
                    new MessageEmbed()
                        .setAuthor({ name: sprintf(dmErrorContent.authorContent, infor), url: infor.endorserEndorsementLink, iconURL: interaction.user.avatarURL() })
                        .setTitle(sprintf(dmErrorContent.title, infor))
                        .setDescription(sprintf(dmErrorContent.description, infor))
                        .setThumbnail(endorsee.avatarURL())
                ]
            })
        }
        return interaction.followUp({
            content: endorserReply,
            ephemeral: true
        })
    },
    /**
     * @param  {User} user
     * @param  {string} guildId
     */
    async _onboardNewUser(user, guildId){

        const userInform = {
            _id: user.id,
            discordName: user.username,
            discriminator: user.discriminator,
            discordAvatar: user.avatarURL(),
            serverId: guildId
        }

        const [result, error] = await addNewMember(userInform);

        if (error) return {
            error: true,
            message: error
        }

        updateUserCache(user.id, user.username, guildId);
        
        return {
            error: false
        }
    },

    _contents: new Map([
        [{ isNewMember: true, isVerifiedSkill: true} , () => ({
            dmContent: CONSTANT.CONTENT.ENDORSE_NEW_MEMBER_CASE_ENDORSEE_DM,
            dmErrorContent: CONSTANT.CONTENT.ENDORSE_NEW_MEMBER_CASE_ENDORSEE_DM_FAIL
        })],
        [{ isNewMember: true, isVerifiedSkill: false} , () => ({
            dmContent: CONSTANT.CONTENT.ENDORSE_NEW_MEMBER_CASE_ENDORSEE_DM_UNVERIFIED_SKILL,
            dmErrorContent: CONSTANT.CONTENT.ENDORSE_NEW_MEMBER_CASE_ENDORSEE_DM_FAIL_UNVERIFIED_SKILL
        })],
        [{ isNewMember: false, isVerifiedSkill: true} , () => ({
            dmContent: CONSTANT.CONTENT.ENDORSE_OLD_MEMBER_CASE_ENDORSEE_DM,
            dmErrorContent: CONSTANT.CONTENT.ENDORSE_OLD_MEMBER_CASE_ENDORSEE_DM_FAIL
        })],
        [{ isNewMember: false, isVerifiedSkill: false} , () => ({
            dmContent: CONSTANT.CONTENT.ENDORSE_OLD_MEMBER_CASE_ENDORSEE_DM_UNVERIFIED_SKILL,
            dmErrorContent: CONSTANT.CONTENT.ENDORSE_OLD_MEMBER_CASE_ENDORSEE_DM_FAIL_UNVERIFIED_SKILL
        })]
    ])

}