const myCache = require("./cache");
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

function validUser(userId){
    const result = myCache.get("users").filter(value => value._id == userId);
    return result.length != 0?result[0]:null
}

function validSkill(skillId){
    const result = myCache.get("skills").filter(value => value._id == skillId);
    return result.length != 0?result[0]:null
}

function validProject(projectId){
    const result = myCache.get("projects").filter(value => value._id == projectId);
    return result.length != 0?result[0]:null
}

module.exports = { awaitWrap, validProject, validSkill, validUser }