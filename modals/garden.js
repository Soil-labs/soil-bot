const { ModalSubmitInteraction, MessageEmbed, MessageActionRow, MessageButton} = require("discord.js");
const { createProjectUpdate }  = require("../helper/graphql");
const { sprintf } = require("sprintf-js");
const CONSTANT = require("../helper/const");
const myCache = require("../helper/cache");


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
            content: "Cannot find your submit record",
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
        const replyEmbed = new MessageEmbed().setDescription("Check the [Garden Feed](https://eden-garden-front.vercel.app/)\nCheck the [Garden Graph](https://garden-rho.vercel.app/)");
        // Temporarily hard coded for Soil Team Server
        if (hasThread && guildId == "988301790795685930") {
            const targetChannel = interaction.guild.channels.cache.get("1001547443135058010");
            if (targetChannel.type == "GUILD_TEXT"){
                thread = await targetChannel.threads.create({
                    name: title
                })
                let embedDescription = `**Team Included**: ${teamName}\n**Role Included**: ${roleName}\n**Title**: ${title}\n**Content**: ${content}`;
                if (tokenAmount) embedDescription += `\n**Token Transferred**: \`${tokenAmount}\``;
                await thread.send({
                    content: memberIds.map((value) => (`<@${value}>`)).toString(),
                    embeds: [
                        new MessageEmbed()
                            .setAuthor({ name: `@${interaction.member.displayName} -- created this update`, iconURL: interaction.user.avatarURL() })
                            .setTitle(`${projectTitle} Updates`)
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
            }else return interaction.followUp({
                embeds: [replyEmbed.setTitle("Update successfully but fail to create a thread")]
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
        console.log(gardenUpdateInform);
        
        const [result, error] = await createProjectUpdate(gardenUpdateInform);
            
        if (error) return interaction.followUp({
            content: `Error occured when fetching project details: \`${error}\``
        })
        
        delete gardenContext[userId];
        myCache.get("gardenContext", gardenContext);

        return interaction.followUp({
            embeds: [replyEmbed.setTitle("Update successfully the Secret Garden")]
        })
	}

}