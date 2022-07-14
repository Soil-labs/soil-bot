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

const LINK = Object.freeze({
    PROJECT: "https://www.soil.xyz/project/%s",
    PROJECT_GATEWAY: "https://www.soil.xyz/project/",
    USER: "https://www.soil.xyz/profile/%s",
    SKILL: "https://www.soil.xyz/member/%s",
    ONBOARD: "https://www.soil.xyz/onboard/%s"
})

module.exports = { URL, GRAPHQL_ERROR, SKILL_STATE, LINK }