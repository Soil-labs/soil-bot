const myCache = require("./cache");
const CONSTANT = require("../helper/const");
const _ = require('lodash');
const { GuildChannel } = require("discord.js");
const { PermissionFlagsBits } = require("discord-api-types/v9");

/**
 * @param  {Promise} promise
 * @param  {string} renamedObject="result"
 * @param  {string} renamedError="error"
 */
async function awaitWrap(promise, renamedObject = "result", renamedError = "error") {
    return promise
        .then((data) => {
            return {
                [renamedObject]: data,
                [renamedError]: null
            }
        })
        .catch((err) => {
            return {
                [renamedObject]: null,
                [renamedError]: err
            }
        });
}

/**
 * @param  {Promise} promise
 * @param  {number} timeout=CONSTANT.NUMERICAL_VALUE.GRAPHQL_TIMEOUT_SHORT
 * @param  {string} renamedObject="result"
 * @param  {string} renamedError="error"
 */
async function awaitWrapTimeout(promise, timeout = CONSTANT.NUMERICAL_VALUE.GRAPHQL_TIMEOUT_SHORT, renamedObject = "result", renamedError = "error"){
    return Promise.race([
        promise,
        new Promise((_, rej) => setTimeout(() => rej(new Error(CONSTANT.ERROR.TIMEOUT)), timeout))
    ]).then((data) => {
        return {
            [renamedObject]: data,
            [renamedError]: null
        }
    }).catch((err) => {
        return {
            [renamedObject]: null,
            [renamedError]: err
        }
    });
}

function validUser(userId, guildId){
    const result = myCache.get("users")[userId];
    if (!result) return null;
    return result["serverId"].includes(guildId) ? result : null;
}

function validSkill(skillId){
    return myCache.get("skills")[skillId] ?? null;
}

function validProject(projectId, guildId){
    const result = myCache.get("projects")[guildId];
    if (!result) return null;
    return result[projectId] ?? null
}

function validTeam(teamId, guildId){
    const result = myCache.get("teams")[guildId];
    if (!result) return null;
    return result[teamId] ?? null
}

function validRole(roleId, guildId){
    const result = myCache.get("roles")[guildId];
    if (!result) return null;
    return result[roleId] ?? null
}

function updateUserCache(userId, discordName, guildId){
    const cached = myCache.get("users");
    const servers = cached[userId]?.serverId ?? [];
    myCache.set("users", {
        ...cached,
        [userId]: {
            discordName: discordName,
            serverId: _.uniq([...servers, guildId])
        }
    });
}

function updateUsersCache(userInforms, guildId){
    let toBecached = {};
    const cached = myCache.get("users");
    userInforms.forEach((userInform) => {
        const userId = userInform.id;
        const discordName = userInform.discordName;
        const servers = cached[userId]?.serverId ?? [];
        toBecached = {
            ...toBecached,
            [userId]: {
                discordName: discordName,
                serverId: _.uniq([...servers, guildId])
            }
        }
    })
    myCache.set("users", {
        ...cached,
        ...toBecached
    });
}

function insertVerticalBar(array){
    // const length = array.length;
    // for (let i = 0; i < length; i ++){
    //     array.splice(1 + 2 * i, 0, ' | ')
    // }
    // array.pop();
    // return array.toString().replace(/,/g, '')
    const tmp = array.map((value, index) => {
        if (index == 0) return `${value}`
        else return ` ${value}`
    })
    return tmp.toString()
}
/**
 * @param  { GuildChannel } channel
 * @param  { string } userId
 */
function checkChannelSendPermission(channel, userId){
    return channel.permissionsFor(userId).has(PermissionFlagsBits.SendMessages) && channel.permissionsFor(userId).has(PermissionFlagsBits.ViewChannel);
}

function isValidDate(month, day){
    const thisYear = new Date().getUTCFullYear();
    const date = new Date(`${thisYear}-${month}-${day}`);
    return date != "Invalid Date";
}

function getNextBirthday(month, day, offset){
    const date = new Date();
    const thisYear = new Date().getUTCFullYear();
    const machineTimezonBirthday= new Date(`${thisYear}-${month}-${day}`).getTime();
    let utcBirthday = machineTimezonBirthday + date.getTimezoneOffset() * 60000;
    let offsetBirthday = utcBirthday - 3600000 * offset;
    if (date.getTime() > machineTimezonBirthday){
        utcBirthday = new Date(`${thisYear + 1}-${month}-${day}`).getTime() + date.getTimezoneOffset() * 60000;
        offsetBirthday = utcBirthday - 3600000 * offset;
    }
    return Math.floor(offsetBirthday / 1000);
}

function getCurrentTimeInSec(){
    return Math.floor(new Date().getTime() / 1000);
}

function _padTo2Digits(num) {
  return num.toString().padStart(2, '0');
}

function convertMsToTime(milliseconds) {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  seconds = seconds % 60;
  minutes = minutes % 60;

  // 👇️ If you don't want to roll hours over, e.g. 24 to 00
  // 👇️ comment (or remove) the line below
  // commenting next line gets you `24:00:00` instead of `00:00:00`
  // or `36:15:31` instead of `12:15:31`, etc.
  hours = hours % 24;

  return `${_padTo2Digits(hours)}:${_padTo2Digits(minutes)}:${_padTo2Digits(
    seconds,
  )}`;
}

module.exports = { 
    awaitWrap, 
    awaitWrapTimeout,
    validProject, 
    validSkill, 
    validUser, 
    validTeam,
    validRole,
    insertVerticalBar, 
    updateUserCache,
    updateUsersCache,
    checkChannelSendPermission,
    isValidDate,
    getNextBirthday,
    getCurrentTimeInSec,
    convertMsToTime
}