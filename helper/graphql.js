const { gql, GraphQLClient } = require("graphql-request")
const { awaitWrap } = require("./util");
const CONSTANT = require("./const");

const client = new GraphQLClient(CONSTANT.LINK.GRAPHQL, { headers: {} })

const GET_PROJECTS = gql`
    query{
        findProjects(fields:{}){
            _id
            title
            description      
        }
    }
`;

const GET_SKILLS = gql`
    query{
        findSkills(fields:{
        }){
            _id
            name
            state
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

const GET_TEAMS = gql`
  query{
    findTeams(fields:{}){
      _id
      name
    }
  }
`

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

const GET_UNVERIFIED_SKILL = gql`
  query{
      waitingToAproveSkills(fields:{}){
        _id
        name
      }
    }
`

const ADD_SKILL_TO_MEMBER = gql`
  mutation (
    $skillID: ID
    $memberID: ID
    $authorID: ID
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
    $title: String
    $approved: Boolean
  ){
    newTweetProject(
      fields: {
        projectID: $projectID
        title: $title
        content: $content
        author: $author
        approved: $approved
      }
    ){
      numTweets
      newTweetID
    }
  }
`;

const APPROVE_TWEET = gql`
  mutation(
    $projectID: ID
    $tweetID: ID
    $approved: Boolean
  ){
    approveTweet(fields:{
      projectID: $projectID
      tweetID: $tweetID
      approved: $approved 
    }){
      title
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
            title
            description
            tweets{
                title
                content
                author {
                    discordName
                }
                registeredAt
                approved
            }
            role{
              _id
              title
            }    
            champion{
              _id
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
              skillInfo{
                name
                authors{
                  discordName
                }
                registeredAt
              }
            }
            projects{
                info{
                  title
                }
            }
            hoursPerWeek
            attributes{
              Director
              Motivator
              Inspirer
              Helper
              Supporter
              Coordinator
              Observer
              Reformer
            }
        }
    }
`;

const FETCH_TEAM_DETAIL = gql`
  query(
    $teamIds: [ID]
  ){
    findTeams(fields:{
      _id: $teamIds
    }){
      description
      projects{
        _id
        title
      }
      members{
        _id
        discordName
      }
    }
  }
`

const ADD_SKILL = gql`
    mutation(
        $name: String 
    ){
        createSkill(fields:{
            name: $name
        }){
            _id
        }
    }
`;

const FETCH_SKILL_DETAIL = gql`
  query(
    $skillID: ID
  ){
    findSkill(fields:{
        _id: $skillID
    }){
      name
      members{
        _id
      }
    }
  }
`;

const MATCH_MEMBER_TO_USER = gql`
  query(
    $memberId: ID
  ){
    matchMembersToUser(fields:{
      memberID: $memberId
    }){
    matchPercentage
      member{
        _id
        discordName
      }
      commonSkills{
        name
      }
        
    }
  }
`

const MATCH_MEMBER_TO_SKILL = gql`
  query(
    $skillsID: [ID]
  ){
    matchMembersToSkills(fields:{
      skillsID: $skillsID
    }){
      matchPercentage
      member{
        _id
        discordName
      }
      commonSkills{
        name
      }
  }
}
`;

const ENDORSE_ATTRIBUTE = gql`
  mutation(
    $memberId: ID,
    $attribute: attributesEnum
  ){
    endorseAttribute(fields:{
    _id: $memberId
    attribute: $attribute
  }){
      _id
    }
  }
`

const CREATE_PROJECT_UPDATE = gql`
mutation(
  $projectId: String
  $memberIds: [String]
  $authorId: String
  $teamIds: [String]
  $title: String
  $content: String
){
  createProjectUpdate(fields:{
    title: $title
    content: $content
    projectID: $projectId
    memberID: $memberIds
    authorID: $authorId
    teamID: $teamIds
  }){
    _id   
  }
}
`

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

async function fetchUnverifiedSkills(){
    const { result, error } = await awaitWrap(client.request(GET_UNVERIFIED_SKILL));
    if (error) return [null, error]
    else return [result.waitingToAproveSkills, null]
}

async function fetchUsers() {
  const { result, error } = await awaitWrap(client.request(GET_USERS));
  if (error) return [null, error];
  else return [result.findMembers, null];
}

async function fetchTeams(){
  const { result, error } = await awaitWrap(client.request(GET_TEAMS));
  if (error) return [null, error];
  else return [result.findTeams, null];
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

async function approveTweet(tweetJSON){
    const { result, error } = await awaitWrap(client.request(APPROVE_TWEET, tweetJSON));
    if (error) return [null, error]
    else return [result.approveTweet, null];
}

async function fetchProjectDetail(projectIdJSON){
    const { result, error } = await awaitWrap(client.request(FETCH_PROJECT_DETAIL, projectIdJSON));
    if (error) return [null, error]
    else return [result.findProject, null];
}

async function fetchUserDetail(userIdJSON){
    const { result, error } = await awaitWrap(client.request(FETCH_USER_DETAIL, userIdJSON));
    if (error) return [null, error]
    else return [result.findMember, null];
}

async function fetchTeamDetail(teamIdsJSON){
    const { result, error } = await awaitWrap(client.request(FETCH_TEAM_DETAIL, teamIdsJSON));
    if (error) return [null, error]
    else return [result.findTeams, null];
}

async function fetchSkillDetail(skillJSON){
    const { result, error } = await awaitWrap(client.request(FETCH_SKILL_DETAIL, skillJSON));
    if (error) return [null, error]
    else return [result.findSkill, null];
}

async function addSkill(skillNameJSON){
    const { result, error } = await awaitWrap(client.request(ADD_SKILL, skillNameJSON));
    if (error) return [null, error]
    else return [result.createSkill, null];
}

async function matchMemberToUser(memberJSON){
    const { result, error } = await awaitWrap(client.request(MATCH_MEMBER_TO_USER, memberJSON));
    if (error) return [null, error]
    else return [result.matchMembersToUser, null];
}

async function matchMemberToSkill(skillsJSON){
    const { result, error } = await awaitWrap(client.request(MATCH_MEMBER_TO_SKILL, skillsJSON));
    if (error) return [null, error]
    else return [result.matchMembersToSkills, null];
}

async function endorseAttribute(attributeJSON){
    const { result, error } = await awaitWrap(client.request(ENDORSE_ATTRIBUTE, attributeJSON));
    if (error) return [null, error]
    else return [result.endorseAttribute, null];
}

async function createProjectUpdate(projectUpdateJSON){
    const { result, error } = await awaitWrap(client.request(CREATE_PROJECT_UPDATE, projectUpdateJSON));
    if (error) return [null, error]
    else return [result.createProjectUpdate, null];
}


module.exports = { 
  fetchProjects, 
  fetchSkills, 
  fetchUsers, 
  fetchTeams,
  fetchUnverifiedSkills, 
  updateUser, 
  addSkillToMember, 
  newTweetProject, 
  approveTweet,
  addSkill, 
  fetchProjectDetail, 
  fetchUserDetail, 
  fetchTeamDetail,
  fetchSkillDetail,
  matchMemberToUser,
  matchMemberToSkill,
  endorseAttribute,
  createProjectUpdate
};