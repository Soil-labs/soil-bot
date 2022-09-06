const timezones = require('timezones.json/timezones.json')

let _endPoint, _frontEnd, _champion, _project, _projectAll, _projectTweets, _createProject, _signUp;
switch(process.env.VERSION){
  case "Test":
    _endPoint = "https://soil-test-backend.herokuapp.com/graphql";
    _frontEnd = "https://soil-app-front-end-zeta.vercel.app";
    _champion = _frontEnd + "/champion-dashboard";
    _project = _frontEnd + "/projects/%s";
    _projectAll = _frontEnd + "/projects?tab=1";
    _projectTweets = _frontEnd + "/projects/%s/feed";
    _createProject = _frontEnd + "/form/%s";
    _signUp = _frontEnd + "/member/signup"; 
    break;
  case "Develop":
    _endPoint = "http://oasis-bot-test-deploy.herokuapp.com/graphql";
    _frontEnd = "https://oasis-app-front-end-zeta.vercel.app/";
    _champion = _frontEnd + "/champion-dashboard";
    _project = _frontEnd + "/projects/%s";
    _projectAll = _frontEnd + "/projects?tab=1";
    _projectTweets = _frontEnd + "/projects/%s/feed";
    _createProject = _frontEnd + "/form/%s";
    _signUp = _frontEnd + "/member/signup";
    break; 
  case "Production":
    _endPoint = "https://eden-deploy.herokuapp.com/graphql";
    _frontEnd = "https://eden-app-front-end-zeta.vercel.app/";
    _champion = _frontEnd + "/champion-dashboard";
    _project = _frontEnd + "/projects/%s";
    _projectAll = _frontEnd + "/projects?tab=1";
    _projectTweets = _frontEnd + "/projects/%s/feed";
    _createProject = _frontEnd + "/form/%s";
    _signUp = _frontEnd + "/member/signup";
    break;
  default:
    logger.error("Please check the bot version in .env");
    process.exit(1)
}

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
    EDEN_WEBPAGE: "https://www.edenprotocol.app",
    GRAPHQL_ENDPOINT: _endPoint,
    PROJECT_TWEET: _projectTweets,
    USER: "https://www.soil.xyz/profile/%s/",
    SKILL: "https://www.soil.xyz/member/%s/",
    STAGING_ONBOARD: _frontEnd + "onboard%s",
    ENDORSEMENTS: "https://www.soil.xyz/member/%s/endorsements/",
    CLAIM_ENDORSEMENT: "https://www.soil.xyz/endorsment/%s/",
    SIGNUP: _signUp,
    GARDEN_FEED: "https://eden-garden-front.vercel.app/",
    GARDEN_GRAPH: "https://garden-rho.vercel.app/",
    PROJECT: _project,
    PROJECT_ALL: _projectAll,
    LAUNCH_PROJECT: _createProject,
    DASHBOARD: _champion,
    DISCORD_MSG: "https://discord.com/channels/%(guildId)s/%(channelId)s/%(messageId)s",
    THREAD: "https://discord.com/channels/%(guildId)s/%(threadId)s",
    ROOM: "https://eden-foundation.vercel.app/onboard/party/%(roomId)s?memberId=%(userId)s"
})

const CONTENT = Object.freeze({
    ONBOARD: "Growing the garden of opportunities is how we are all going to make it. To onboard new members, click [here](%(onboardLink)s).",
    ONBOARD_SELF: "In order for Eden 🌳 to recommend the right projects for you, we need to know about your skills. Add them [here](%(onboardLink)s).",
    GROUP_ONBORAD: "Growing the garden of opportunities is how we are all going to make it. To onboard new members, click [here](%(onboardLink)s).",
    INVITE_DM: "<@%(inviterId)s> has invited you to join the tool we use to coordinate talent across the community. It uses AI to make smart, community driven recommendations for projects you'd love. To join, click [here](%(onboardLink)s).",
    INVITE_DM_FAIL: "Hi <@%(inviteeId)s>! Eden is the tool we use to coordinate talent across the community. It uses AI to make smart, community driven recommendations for projects you'd love. To join, click [here](%(onboardLink)s).",
    
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

    MATCH_PROJECT: "Find all the relevant projects for you [here](%s).",
    //MATCH_PROJECT_FAIL: "Wow, your skill is so special that no matching result is for you. You are unique!\n\u200B\n",

    ENDORSE_ATTRIBUTE: "You have successfully endorsed \`%(endorseeName)s\` with \`%(attributeName)s\` trait.",
})

const NUMERICAL_VALUE = Object.freeze({
    BUTTON_COLLECTOR_INTERVAL: 20,
    DB_ID_LENGTH: 24,
    DISCORD_ID_LENGTH: 18,
    AUTOCOMPLETE_OPTION_LENGTH: 25,
    GRAPHQL_TIMEOUT_SHORT: 5 * 1000,
    GRAPHQL_TIMEOUT_LONG: 10 * 1000,
    BIRTHDAY_CHECK_INTERVAL: 60,
    ONBOARD_REPEAT_CONTEXT: 1 * 60
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

const TIMEZONES = Object.freeze(
    [
        { name: 'UTC-01', value: '-1' },
        { name: 'UTC-02', value: '-2' },
        { name: 'UTC-03', value: '-3' },
        { name: 'UTC-04', value: '-4' },
        { name: 'UTC-05', value: '-5' },
        { name: 'UTC-06', value: '-6' },
        { name: 'UTC-07', value: '-7' },
        { name: 'UTC-08', value: '-8' },
        { name: 'UTC-09', value: '-9' },
        { name: 'UTC-10', value: '-10' },
        { name: 'UTC-11', value: '-11' },
        { name: 'UTC-12', value: '-12' },
        { name: 'UTC+00', value: '0' },
        { name: 'UTC+01', value: '1' },
        { name: 'UTC+02', value: '2' },
        { name: 'UTC+03', value: '3' },
        { name: 'UTC+04', value: '4' },
        { name: 'UTC+05', value: '5' },
        { name: 'UTC+06', value: '6' },
        { name: 'UTC+07', value: '7' },
        { name: 'UTC+08', value: '8' },
        { name: 'UTC+09', value: '9' },
        { name: 'UTC+10', value: '10' },
        { name: 'UTC+11', value: '11' },
        { name: 'UTC+12', value: '12' },
        { name: 'UTC+13', value: '13' },
    ]
)

module.exports = { 
    GRAPHQL_ERROR, 
    SKILL_STATE, 
    ERROR,
    LINK, 
    CONTENT,
    NUMERICAL_VALUE,
    MESSAGE_SETTING,
    ATTRIBUTES,
    TIMEZONES
}