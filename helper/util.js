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

module.exports = {awaitWrap}