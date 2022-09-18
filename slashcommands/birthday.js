const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require("discord.js");
const { isValidDate, getNextBirthday, awaitWrap } = require('../helper/util');
const { getApp } = require('firebase/app')
const { getFirestore, doc, setDoc } = require("firebase/firestore");

const myCache = require('../helper/cache');
const CONSTANT = require("../helper/const");
module.exports = {
    commandName: "birthday",
    description: "Tell me your birthday and we celebrate togather!",

    data: null,

    generateData() {
        this.data = new SlashCommandBuilder()
            .setName(this.commandName)
            .setDescription(this.description)
            .addStringOption(option =>
                option.setName("month")
                    .setDescription("Your birthday month")
                    .setRequired(true)
                    .addChoices(
                        {
                            name: "January",
                            value: "1"
                        },
                        {
                            name: "February",
                            value: "2"
                        },
                        {
                            name: "March",
                            value: "3"
                        },
                        {
                            name: "April",
                            value: "4"
                        },
                        {
                            name: "May",
                            value: "5"
                        },
                        {
                            name: "June",
                            value: "6"
                        },
                        {
                            name: "July",
                            value: "7"
                        },
                        {
                            name: "August",
                            value: "8"
                        },
                        {
                            name: "September",
                            value: "9"
                        },
                        {
                            name: "October",
                            value: "10"
                        },
                        {
                            name: "November",
                            value: "11"
                        },
                        {
                            name: "December",
                            value: "12"
                        },
                    ))
            .addIntegerOption(option =>
                option.setName("day")
                    .setDescription("Your birthday day")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("timezone")
                    .setDescription("Choose your timezone")
                    .setRequired(true)
                    .setAutocomplete(true))
    },

    /**
     * @param  {CommandInteraction} interaction
     */
    async execute(interaction) {
        if (!myCache.has("birthday")) return interaction.reply({
            content: "System is initing... Please try again.",
            ephemeral: true
        })
        const month = interaction.options.getString("month");
        const day = interaction.options.getInteger("day");
        const timezone = interaction.options.getString("timezone");
        const userId = interaction.user.id;

        if (!isValidDate(month, day)) return interaction.reply({
            content: `Your input \`${month}-${day}\` is a invalid date.`,
            ephemeral: true
        });

        const offset = Number(timezone);
        if (offset == NaN) return interaction.reply({
            content: `Your input \`timezone\` is invalid.`,
            ephemeral: true
        });

        const birthdayDateInSec = getNextBirthday(month, day.toString(), timezone);
        let cached = myCache.get("birthday");
        if (userId in cached){
            if (cached[userId].date == birthdayDateInSec) {
                return interaction.reply({
                    content: `Your birthday date has been updated. Next birthday is <t:${birthdayDateInSec}:D>(<t:${birthdayDateInSec}:R>)`,
                    ephemeral: true
                })
            }
        }
        await interaction.deferReply({ ephemeral: true });
        const birthdayInform = {
            date: birthdayDateInSec,
            month: month,
            day: day.toString(),
            offset: timezone
        }
        const birthdaySnap = doc(getFirestore(getApp()), "Birthday", userId);
        const { result, error } = await awaitWrap(setDoc(birthdaySnap, birthdayInform));

        if (error) return interaction.followUp({
            content: "Sorry, cannot connect with Database."
        })

        cached[userId] = birthdayInform;
        myCache.set("birthday", cached, CONSTANT.NUMERICAL_VALUE.BIRTHDAY_CHECK_INTERVAL);

        return interaction.followUp({
            content: `Your birthday date has been updated. Next birthday is <t:${birthdayDateInSec}:D>(<t:${birthdayDateInSec}:R>)`
        })

    }

}