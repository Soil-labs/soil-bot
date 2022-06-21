//DataBase Init and readWrite


/**
 * @param  {string} projectName
 * @param  {string} user
 * @param  {string} news
 */
async function update(projectName, user, news){
    //to-do
    return true;
}
/**
 * @param  {string} projectName
 */
async function search(projectName){
    const random = Math.random()
    if (random > 0.5){
        return true
    }else{
        return false
    }
}

/**
 * @param  {string} projectName
 */
async function insert(projectName){

}

module.exports = {update, search, insert}