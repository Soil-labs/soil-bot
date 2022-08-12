const myCache = require("./cache");
const CONSTANT = require("../helper/const");

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
    return result[serverId].includes(guildId) ? result : null;
}

function validSkill(skillId){
    return myCache.get("skills")[skillId] ?? null;
}

function validProject(projectId, guildId){
    const result = myCache.get("projects")[guildId];
    if (!result) return null;
    return result[projectId] ?? null
}

function updateUserCache(userId, discordName, guildId){
    const cached = myCache.get("users");
    if (!cached[userId]) myCache.set("users", {
        ...cached,
        [userId]: {
            discordName: discordName,
            serverId: [guildId]
        }
    })
    else {
        const guilds = cached[userId]["serverId"];
        myCache.set("users", {
            ...cached,
            [userId]: {
                discordName: discordName,
                serverId: guilds.includes(guildId) ? guilds : [...guilds, guildId]
            }
        })
    }
    
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

module.exports = { 
    awaitWrap, 
    awaitWrapTimeout,
    validProject, 
    validSkill, 
    validUser, 
    insertVerticalBar, 
    updateUserCache,
}