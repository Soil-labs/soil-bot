const { ModalSubmitInteraction, MessageEmbed, MessageActionRow, MessageButton} = require("discord.js");
const { createProjectUpdate }  = require("../helper/graphql");
const { sprintf } = require("sprintf-js");
const CONSTANT = require("../helper/const");
const myCache = require("../helper/cache");
const _ = require("lodash");

module.exports = {
    customId: "garden",

	/**
	 * @param  {ModalSubmitInteraction} interaction
	 */
	async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        let gardenContext = myCache.get("gardenContext");
        if (!gardenContext[userId]) return interaction.reply({
            content: "Cannot find your submit record, please report to the admin.",
            ephemeral: true
        })
        const title = interaction.fields.getTextInputValue("garden_title").trim();
        const content = interaction.fields.getTextInputValue("garden_content").trim();

        const { 
            projectId, 
            memberIds, 
            teamIds, 
            roleIds, 
            hasThread, 
            tokenAmount,
            projectTitle,
            teamName,
            roleName
        } = gardenContext[userId];
        await interaction.deferReply({ ephemeral: true });

        let thread = null;
        // Temporarily hard coded for Soil Team Server
        if (hasThread && guildId == "996558082098339953") {
            const targetChannel = interaction.guild.channels.cache.get("1008476220352114748");
            if (targetChannel.type == "GUILD_TEXT"){
                thread = await targetChannel.threads.create({
                    name: title
                })
                let embedDescription = `\u200B\n**Project**: ${projectTitle}\n**Team**: ${teamName}\n**Role**: ${roleName}`;
                if (tokenAmount) embedDescription += `\n**Token Transferred**: \`${tokenAmount}\``;
                await thread.send({
                    content: _.uniq([...memberIds, userId]).map((value) => (`<@${value}>`)).toString(),
                    embeds: [
                        new MessageEmbed()
                            .setAuthor({ name: `@${interaction.member.displayName} -- Author`, iconURL: interaction.user.avatarURL() })
                            .setDescription(embedDescription)
                    ],
                    components: [
                        new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setLabel("Garden Feed")
                                    .setEmoji("🔗")
                                    .setStyle("LINK")
                                    .setURL("https://eden-garden-front.vercel.app/"),
                                new MessageButton()
                                    .setLabel("Garden Graph")
                                    .setEmoji("🔗")
                                    .setStyle("LINK")
                                    .setURL("https://garden-rho.vercel.app/"),
                            )
                    ]
                })
                await thread.send({
                    content: `**Content**: \n${content}`
                })
            }else return interaction.followUp({
                content: "Update successfully but fail to create a thread"
            })
        }
        let gardenUpdateInform = {
            projectId: projectId,
            memberIds: memberIds,
            authorId: userId,
            teamIds: teamIds,
            roleIds: roleIds,
            title: title,
            content: content,
            serverId: [guildId]
        }
        if (hasThread) gardenUpdateInform.threadLink = sprintf(CONSTANT.LINK.THREAD, {
            guildId: guildId,
            threadId: thread.id
        })

        if (tokenAmount) gardenUpdateInform.tokenAmount = tokenAmount.toString();
        
        const [result, error] = await createProjectUpdate(gardenUpdateInform);
            
        if (error) return interaction.followUp({
            content: `Error occured when fetching project details: \`${error}\``
        })
        
        delete gardenContext[userId];
        myCache.get("gardenContext", gardenContext);
        
        let reply = "Update the Secret Garden successfully!";
        if (hasThread){
            return interaction.followUp({
                content: `Update the Secret Garden successfully! Check the thread <#${thread.id}>.`
            })
        }else {
            return interaction.followUp({
                content: "Update the Secret Garden successfully!",
                components: [
                    new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setLabel("Garden Feed")
                                .setEmoji("🔗")
                                .setStyle("LINK")
                                .setURL("https://eden-garden-front.vercel.app/"),
                            new MessageButton()
                                .setLabel("Garden Graph")
                                .setEmoji("🔗")
                                .setStyle("LINK")
                                .setURL("https://garden-rho.vercel.app/"),
                        )
                ]
            })
        }
        
	}

}