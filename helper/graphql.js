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
    }
  }
`;

const NEW_TWEET_PROJECT = gql`
  mutation($projectID: Int!, $content: String!, $author: String!) {
    newTweetPorject(
      fields: {
        projectID: $projectID
        content: $content
        author: $author
      }
    ){
      numTweets
      tweets {
        content
        author {
          discordName
          skills {
            tagName
          }
        }
        registeredAt
      }
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

module.exports = { fetchProjects, fetchSkills, fetchUsers, updateUser };

// (async ()=>{
//     const [result, error] = await updateUser({
//         _id: "891314708689354183",
//         discordName: "buller",
//         discriminator: "2739",
//         discordAvatar: "adsfe222e2efdscv3i8t"
//     });
//     console.log(error?error.message:result)
// })()
