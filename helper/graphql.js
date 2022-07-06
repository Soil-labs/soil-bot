const { gql, GraphQLClient } = require("graphql-request")
const { awaitWrap } = require("./util");
const CONSTANT = require("./const");

const client = new GraphQLClient(CONSTANT.URL.GRAPHQL, { headers: {} })

const GET_PROJECTS = gql`
    query{
        findProjects(fields:{}){
            _id
            tagName      
        }
    }
`;

const GET_SKILLS = gql`
    query{
        findSkills(fields:{
        }){
            _id
            tagName
        }
    }
`;

const GET_USERS = gql`
  query {
    findMembers(fields: {}) {
      _id
      discordName
      discordAvatar
      discriminator
    }
  }
`;

const UPDATE_USER = gql`
  mutation (
    $_id: ID
    $discordName: String!
    $discriminator: String!
    $discordAvatar: String!
  ) {
    updateMember(
      fields: {
        _id: $_id
        discordName: $discordName
        discriminator: $discriminator
        discordAvatar: $discordAvatar
      }
    ) {
      _id
      discriminator
      discordName
      discordAvatar
    }
  }
`;

const ADD_SKILL_TO_MEMBER = gql`
  mutation (
    $skillID: String
    $memberID: String
    $authorID: String
  ){
  addSkillToMember(
    fields:{
      skillID: $skillID
      memberID: $memberID
      authorID: $authorID
  }){
  	discordName
  }
}
`

const NEW_TWEET_PROJECT = gql`
  mutation(
    $projectID: ID
    $content: String
    $author: String
  ){
    newTweetProject(
      fields: {
        projectID: $projectID
        content: $content
        author: $author
      }
    ){
      numTweets
    }
  }
`;

const FETCH_PROJECT_DETAIL = gql`
    query(
        $projectID: ID
    ){
        findProject(fields:{
            _id: $projectID
        }){
            tagName
            title
            description
            tweets{
                content
                author {
                    discordName
                }
                registeredAt
            }    
        }
    }
`;

const FETCH_USER_DETAIL = gql`
    query(
        $userID: ID
    ){
        findMember(fields:{
            _id: $userID
        }){
            skills{
                tagName
                authors{
                    discordName
                }
                registeredAt
            }
            projects{
                tagName
            }
        }
    }
`;

const ADD_SKILL = gql`
    query(
        $tagName: String 
    ){
        findSkill(fields:{
            tagName: $tagName
        }){
            _id
        }
    }
`;

async function fetchProjects() {
    const { result, error } = await awaitWrap(client.request(GET_PROJECTS));
    if (error) return [null, error]
    else return [result.findProjects, null]
}

async function fetchSkills() {
    const { result, error } = await awaitWrap(client.request(GET_SKILLS));
    if (error) return [null, error]
    else return [result.findSkills, null]
}

async function fetchUsers() {
  const { result, error } = await awaitWrap(client.request(GET_USERS));
  if (error) return [null, error];
  else return [result.findMembers, null];
}

async function updateUser(userJSON) {
    const { result, error } = await awaitWrap(client.request(UPDATE_USER, userJSON));
    if (error) return [null, error]
    else return [result.updateMember, null];
}

async function addSkillToMember(addSkillJSON){
    const { result, error } = await awaitWrap(client.request(ADD_SKILL_TO_MEMBER, addSkillJSON));
    if (error) return [null, error]
    else return [result.addSkillToMember, null];
}

async function newTweetProject(tweetJSON){
    const { result, error } = await awaitWrap(client.request(NEW_TWEET_PROJECT, tweetJSON));
    if (error) return [null, error]
    else return [result.newTweetProject, null];
}

async function fetchProjectDetail(projectIdJSON){
    const { result, error } = await awaitWrap(client.request(FETCH_PROJECT_DETAIL, projectIdJSON));
    if (error) return [null, error]
    else return [result.findProject, null];
}

async function fecthUserDetail(userIdJSON){
    const { result, error } = await awaitWrap(client.request(FETCH_USER_DETAIL, userIdJSON));
    if (error) return [null, error]
    else return [result.findMember, null];
}

async function addSkill(skillNameJSON){
    const { result, error } = await awaitWrap(client.request(ADD_SKILL, skillNameJSON));
    if (error) return [null, error]
    else return [result.findSkill, null];
}


module.exports = { fetchProjects, fetchSkills, fetchUsers, updateUser, addSkillToMember, newTweetProject, fetchProjectDetail, addSkill, fecthUserDetail };

// (async ()=>{
//     const [result, error] = await updateUser({
//         _id: "891314708689354183",
//         discordName: "buller",
//         discriminator: "2739",
//         discordAvatar: "adsfe222e2efdscv3i8t"
//     });
//     console.log(error?error.message:result)
// })()
