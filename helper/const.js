const URL = Object.freeze({
    GRAPHQL: "https://oasis-bot-test-deploy.herokuapp.com/graphql",
    NEW_PROJECT: "https://soil-app-front-p7kor7uzy-msaratzidis-gmailcom.vercel.app/form"
})

const GRAPHQL_ERROR = Object.freeze({
    KEY_ERROR: "Key Error."
})

const SKILL_STATE = Object.freeze({
    WAITING: "waiting",
    REJECTED: "rejected",
    APPROVED: "approved"
})

module.exports = {URL, GRAPHQL_ERROR, SKILL_STATE}