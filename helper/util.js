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

module.exports = { awaitWrap, awaitWrapTimeout, validProject, validSkill, validUser, insertVerticalBar }