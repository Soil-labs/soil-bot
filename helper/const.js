const GRAPHQL_ERROR = Object.freeze({
    KEY_ERROR: "Key Error."
})

const SKILL_STATE = Object.freeze({
    WAITING: "waiting",
    REJECTED: "rejected",
    APPROVED: "approved"
})

const ERROR = Object.freeze({
    TIMEOUT: "TimeOut"
})

const LINK = Object.freeze({
    NEW_PROJECT: "https://soil-app-front-p7kor7uzy-msaratzidis-gmailcom.vercel.app/form",
    PROJECT_TWEET: "https://soil-app-front-end-ruddy.vercel.app/projects/%s/feed",
    SOIL: "https://www.Soil.xyz",
    PROJECT: "https://www.soil.xyz/project/%s",
    PROJECT_GATEWAY: "https://www.soil.xyz/project/",
    USER: "https://www.soil.xyz/profile/%s/",
    SKILL: "https://www.soil.xyz/member/%s/",
    ONBOARD: "https://www.soil.xyz/onboard/%s/",
    STAGING_ONBOARD: "https://soil-app-front-end-ruddy.vercel.app/onboard%s",
    ENDORSEMENTS: "https://www.soil.xyz/member/%s/endorsements/",
    CLAIM_ENDORSEMENT: "https://www.soil.xyz/endorsment/%s/",
    AIRTABLE_ONBOARDING: "https://airtable.com/shrLeYlIfsS7r4ZOi?prefill_discord+Name=@%(discordName)s&prefill_ID=%(discordId)s&prefill_AuthorName=@%(discordName)s&hide_Parent+Record+ID=true&hide_AuthorName=true&hide_ID=true&hide_AuthorID=true",
    RECOMMENDATION: "https://soil-app-front-end-ruddy.vercel.app/projects?tab=1"
})

const CONTENT = Object.freeze({
    ONBOARD: "You're about to onboard another member into Soil 🌳. Click [here](%(onboardLink)s) to continue!",
    ONBOARD_SELF: "In order for Soil 🌱 to recommend the right projects for you, Soil needs to know about your skills. Add them [here](%(onboardLink)s)",
    INVITE_DM: "Soil🌱 is the DAO's magic ✨, AI-driven bot that helps you find opportunities to learn, earn, collaborate & contribute. Your personal onboarding [link](%(onboardLink)s)",
    INVITE_DM_FAIL: "Soil🌱 is the DAO's magic ✨, AI-driven bot that helps you find opportunities to learn, earn, collaborate & contribute. Your personal onboarding [link](%(onboardLink)s)",
    
    ENDORSE_NEW_MEMBER_CASE_ENDORSER_REPLY: "By endorsing other community members, you increase their chance of finding magical opportunities✨.\n\nIn other words, you're awesome. On behalf of \`%(endorseeName)s\`, a heartfelt thank you 🙏 wagmi!\n\nWhile you're at it, feel free to check out your own [endorsements](%(endorserEndorsementLink)s).",
    ENDORSE_OLD_MEMBER_CASE_ENDORSER_REPLY: "On behalf of \`%(endorseeName)s\`, a heartfelt thank you - this is how wagmi ❤️",

    ENDORSE_NEW_MEMBER_CASE_ENDORSEE_DM: Object.freeze({
        authorContent: "🤩 @%(endorserName)s endorsed you for SKILL on Soil 🌱!",
        title: "Congrats @%(endorseeName)s 🎉 - that means your skills are getting noticed in the community!",
        description: "We see that this is your very first time getting endorsed through Soil! We went ahead & made you a temporary 1-day profile to keep the endorsement in your name.\n\nClaim the endorsement forever & get access to amazing opportunities across the DAO by creating a full profile [here](%(claimEndorsementLink)s)."
    }),
    ENDORSE_NEW_MEMBER_CASE_ENDORSEE_DM_FAIL: Object.freeze({
        authorContent: "🤩 @%(endorserName)s endorsed @%(endorseeName)s for SKILL on Soil 🌱!",
        title: "Be quick to claim your endorsement, %(endorseeName)s!",
        description: "Claim your full profile & endorsement [here](%(claimEndorsementLink)s) to get access to all the amazing projects happening in the DAO!"
    }),
    ENDORSE_OLD_MEMBER_CASE_ENDORSEE_DM: Object.freeze({
        authorContent: "🤩 @%(endorserName)s endorsed you for SKILL on Soil 🌱! ",
        title: "Way to go, @%(endorseeName)s 🎉",
        description: "Claim the endorsement [here](%(claimEndorsementLink)s)."
    }),
    ENDORSE_OLD_MEMBER_CASE_ENDORSEE_DM_FAIL: Object.freeze({
        authorContent: "🤩 @%(endorserName)s endorsed @%(endorseeName)s for SKILL on Soil 🌱!",
        title: "Yay for that WAGMI-energy, people 👏",
        description: "<@%(endorseeId)s>, Claim your endorsement [here](%(claimEndorsementLink)s)."
    }),
    ENDORSE_NEW_MEMBER_CASE_ENDORSEE_DM_UNVERIFIED_SKILL: Object.freeze({
        authorContent: "🤩 @%(endorserName)s endorsed you for SKILL on Soil 🌱! ",
        title: "Congrats @%(endorseeName)s 🎉 - that means your skills are getting noticed in the community!",
        description: "We see that this is your very first time getting endorsed through Soil! We went ahead & made you a temporary 1-day profile to keep the endorsement in your name.\n\nClaim the endorsement forever & get access to amazing opportunities across the DAO by creating a full profile [here](%(endorserEndorsementLink)s)."
    }),
    ENDORSE_NEW_MEMBER_CASE_ENDORSEE_DM_FAIL_UNVERIFIED_SKILL: Object.freeze({
        authorContent: "🤩 @%(endorserName)s endorsed @%(endorseeName)s for SKILL on Soil 🌱!",
        title: "Be quick to claim your endorsement, %(endorseeName)s!",
        description: "Claim your full profile & endorsement [here](%(endorserEndorsementLink)s) to get access to all the amazing projects happening in the DAO!"
    }),
    ENDORSE_OLD_MEMBER_CASE_ENDORSEE_DM_UNVERIFIED_SKILL: Object.freeze({
        authorContent: "🤩 @%(endorserName)s endorsed you for SKILL on Soil 🌱! ",
        title: "Congrats @%(endorseeName)s 🎉 - your skills are getting noticed! We didn't know you had this skill yet.",
        description: "To add  SKILL to your profile together with the endorsement, click [here](%(endorserEndorsementLink)s)."
    }),
    ENDORSE_OLD_MEMBER_CASE_ENDORSEE_DM_FAIL_UNVERIFIED_SKILL: Object.freeze({
        authorContent: "🤩 @%(endorserName)s endorsed @%(endorseeName)s for SKILL on Soil 🌱!",
        title: "Congrats @%(endorseeName)s 🎉 - that means your skills are getting noticed by the community! We didn't know you had this skill yet.",
        description: "To add SKILL to your profile together with the endorsement, click [here](%(endorserEndorsementLink)s)."
    }),

    NEW_TWEET_PROJECT_NO_CHAMPION: "A key milestone update to this project:\n\n%(newTweetContent)s\n\nClick [here](%(tweetLink)s) to get this change.",
    NEW_TWEET_PROJECT_CHAMPION_ME: "A key milestone update to your project:\n\n%(newTweetContent)s\n\nClick [here](%(tweetLink)s) to get this change.",
    NEW_TWEET_PROJECT_CHAMPION_DM: "A key milestone update to your project:\n\n%(newTweetContent)s\n\nClick [here](%(tweetLink)s) to get this change.",
    NEW_TWEET_PROJECT_CHAMPION_DM_FAIL: "A key milestone update to your project:\n\n%(newTweetContent)s\n\nClick [here](%(tweetLink)s) to get this change.",

    // MATCH_USER: "Looks like you've matched with quite a few people. Here is top %(matchNum)s best matching candidates.\n\u200B\n",
    // MATCH_USER_FAIL: "Wow, your skill is so special that no matching result is for you. You are unique!\n\u200B\n",
    MATCH_SKILL: "Here are the people that have a similar skillset to yours! Why not reach out & talk about what you have in common?\n\u200B\n",
    MATCH_SKILL_FAIL: "Wow, your skill is so special that no matching result is for you. You are unique!\n\u200B\n",

    ENDORSE_ATTRIBUTE: "You have successfully endorsed \`%(endorseeName)s\` with \`%(attributeName)s\` trait",
})

const NUMERICAL_VALUE = Object.freeze({
    BUTTON_COLLECTOR_INTERVAL: 20,
    DB_ID_LENGTH: 24,
    DISCORD_ID_LENGTH: 18,
    AUTOCOMPLETE_OPTION_LENGTH: 25,
    GRAPHQL_TIMEOUT_SHORT: 2 * 1000,
    GRAPHQL_TIMEOUT_LONG: 10 * 1000,
})

const MESSAGE_SETTING = Object.freeze({
    EMBED_COLOR: "#74FA6D"
})

const ATTRIBUTES = Object.freeze([
    "Director",
    "Motivator",
    "Inspirer",
    "Helper",
    "Supporter",
    "Coordinator",
    "Observer",
    "Reformer"
])

module.exports = { 
    GRAPHQL_ERROR, 
    SKILL_STATE, 
    ERROR,
    LINK, 
    CONTENT,
    NUMERICAL_VALUE,
    MESSAGE_SETTING,
    ATTRIBUTES
}