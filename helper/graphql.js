const { gql, GraphQLClient } = require("graphql-request")
const { awaitWrapTimeout } = require("./util");
const CONSTANT = require("./const");
const myCache = require("./cache");

const _client = new GraphQLClient(CONSTANT.LINK.GRAPHQL_ENDPOINT, { headers: {} })

const GET_SERVER = gql`
  query(
    $guildId: ID
  ){
  findServers(fields:{
    _id: $guildId
  }){
    adminID
    adminRoles
    adminCommands
  }
}
`;

const GET_PROJECTS = gql`
    query{
      findProjects(fields:{}){
        _id
        title
        serverID 
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
      serverID
    }
  }
`;

const GET_TEAMS = gql`
  query{
    findTeams(fields:{}){
      _id
      name
      serverID
    }
  }
`

const GET_UNVERIFIED_SKILL = gql`
  query{
    waitingToAproveSkills(fields:{}){
      _id
      name
    }
  }
`
const ADD_MEMBER = gql`
  mutation(
    $_id: ID,
    $discordName: String
    $discordAvatar: String
    $discriminator: String
    $invitedBy: String
    $serverId: String
  ){
  addNewMember(fields:{
    _id: $_id
    discordName: $discordName
    discordAvatar: $discordAvatar
    discriminator: $discriminator
    invitedBy: $invitedBy
    serverID: $serverId
  }){
    _id
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
    }
  }
`;

const ADD_SKILL_TO_MEMBER = gql`
  mutation (
    $skillID: ID
    $memberID: ID
    $authorID: ID
    $serverId: [String]
  ){
  addSkillToMember(
    fields:{
      skillID: $skillID
      memberID: $memberID
      authorID: $authorID
      serverID: $serverId
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

const UPDATE_SERVER = gql`
  mutation(
    $guildId: ID
    $guildName: String!
    $adminID: [String]!
    $adminRoles: [String]!
    $adminCommands: [String]!
  ){
  updateServer(fields:{
    	_id: $guildId
      name: $guildName
      adminID: $adminID
      adminRoles: $adminRoles
      adminCommands: $adminCommands
  }){
    _id
  }
}
`

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
    $serverId: [String]
  ){
    matchMembersToUser(fields:{
      memberID: $memberId
      serverID: $serverId
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
    $skillsId: [ID]
    $serverId: [String]
  ){
    matchMembersToSkills(fields:{
      skillsID: $skillsId
      serverID: $serverId
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

const MATCH_MEMBER_TO_PROJECT = gql`
  query(
    $memberId: ID
    $serverId: [String]
  ){
  findProjects_RecommendedToUser(fields:{
    memberID: $memberId
    serverID: $serverId
  }){
      matchPercentage
      projectData{
        _id
        title
      }
      role{
        _id
        title
        skills{
          skillData{
            name
          }
        }
      }
    }
  }
`

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
  $serverId: [String]
){
  createProjectUpdate(fields:{
    title: $title
    content: $content
    projectID: $projectId
    memberID: $memberIds
    authorID: $authorId
    teamID: $teamIds
    serverID: $serverId
  }){
    _id   
  }
}
`
async function fetchServer(guildJSON) {
    const { result, error } = await awaitWrapTimeout(_client.request(GET_SERVER, guildJSON), CONSTANT.NUMERICAL_VALUE.GRAPHQL_TIMEOUT_LONG);
    if (error) return [null, _graphqlErrorHandler(error)];
    else return [result.findServers, null];
}

async function fetchProjects() {
    const { result, error } = await awaitWrapTimeout(_client.request(GET_PROJECTS), CONSTANT.NUMERICAL_VALUE.GRAPHQL_TIMEOUT_LONG);
    if (error) return _graphqlErrorHandler(error);
    else {
      let toBecached = {};
      result.findProjects.forEach((value) => {
        const servers = value.serverID;
        const projectId = value._id;
        const projectTitle = value.title;
        //Handle special case, the server should have not been empty
        if (servers.length == 0) return;
        servers.forEach((serverId) => {
          if (toBecached[serverId]){
            toBecached[serverId][projectId] = {
              title: projectTitle
            }
          }else{
            toBecached[serverId] = {
              [projectId]: {
                title: projectTitle
              }
            }
          }
        })
      })
      myCache.set("projects", toBecached);
      return false
    }
}

async function fetchSkills() {
    const { result, error } = await awaitWrapTimeout(_client.request(GET_SKILLS), CONSTANT.NUMERICAL_VALUE.GRAPHQL_TIMEOUT_LONG);
    if (error) return _graphqlErrorHandler(error);
    else {
      let toBecached = {};
      result.findSkills.forEach((value) => {
        toBecached[value._id] = {
          name: value.name,
          state: value.state
        }
      });
      myCache.set("skills", toBecached);
      return false
    }
}

async function fetchUnverifiedSkills(){
    const { result, error } = await awaitWrapTimeout(_client.request(GET_UNVERIFIED_SKILL), CONSTANT.NUMERICAL_VALUE.GRAPHQL_TIMEOUT_LONG);
    if (error) return _graphqlErrorHandler(error);
    else {
      let toBecached = {};
      result.waitingToAproveSkills.forEach((value) => {
        toBecached[value._id] = {
          name: value.name,
        }
      });
      myCache.set("unverifiedSkills", toBecached);
      return false
    }
}

async function fetchUsers() {
  const { result, error } = await awaitWrapTimeout(_client.request(GET_USERS), CONSTANT.NUMERICAL_VALUE.GRAPHQL_TIMEOUT_LONG);
  if (error) return _graphqlErrorHandler(error);
  else {
    let toBecached = {};
    result.findMembers.forEach((value) => {
      toBecached[value._id] = {
        discordName: value.discordName,
        serverId: value.serverID
      }
    })
    myCache.set("users", toBecached);
    return false
  }
}

async function fetchTeams(){
  const { result, error } = await awaitWrapTimeout(_client.request(GET_TEAMS), CONSTANT.NUMERICAL_VALUE.GRAPHQL_TIMEOUT_LONG);
  if (error) return _graphqlErrorHandler(error);
  else {
    let toBecached = {}
    result.findTeams.forEach((value) => {
      const servers = value.serverID;
      const teamName = value.name;
      const teamId = value._id;
      //Handle special case
      if (servers.length == 0) return;
      servers.forEach((serverId) => {
        if (toBecached[serverId]){
          toBecached[serverId][teamId] = {
            name: teamName
          };
        }else{
          toBecached[serverId] = {
            [teamId]: {
              name: teamName
            }
          }
        }
      }) 
    })
    myCache.set("teams", toBecached);
    return false
  }
}

async function addNewMember(userJSON) {
    const { result, error } = await awaitWrapTimeout(_client.request(ADD_MEMBER, userJSON));
    if (error) return [null, _graphqlErrorHandler(error)]
    else return [result.addNewMember, null];
}

async function updateUser(userJSON) {
    const { result, error } = await awaitWrapTimeout(_client.request(UPDATE_USER, userJSON));
    if (error) return [null, _graphqlErrorHandler(error)]
    else return [result.updateMember, null];
}

async function updateServer(serverJSON) {
    const { result, error } = await awaitWrapTimeout(_client.request(UPDATE_SERVER, serverJSON));
    if (error) return [null, _graphqlErrorHandler(error)]
    else return [result.updateServer, null];
}

async function addSkillToMember(addSkillJSON){
    const { result, error } = await awaitWrapTimeout(_client.request(ADD_SKILL_TO_MEMBER, addSkillJSON));
    if (error) return [null, _graphqlErrorHandler(error)]
    else return [result.addSkillToMember, null];
}

async function newTweetProject(tweetJSON){
    const { result, error } = await awaitWrapTimeout(_client.request(NEW_TWEET_PROJECT, tweetJSON));
    if (error) return [null, _graphqlErrorHandler(error)]
    else return [result.newTweetProject, null];
}

async function approveTweet(tweetJSON){
    const { result, error } = await awaitWrapTimeout(_client.request(APPROVE_TWEET, tweetJSON));
    if (error) return [null, _graphqlErrorHandler(error)]
    else return [result.approveTweet, null];
}

async function fetchProjectDetail(projectIdJSON){
    const { result, error } = await awaitWrapTimeout(_client.request(FETCH_PROJECT_DETAIL, projectIdJSON));
    if (error) return [null, _graphqlErrorHandler(error)]
    else return [result.findProject, null];
}

async function fetchUserDetail(userIdJSON){
    const { result, error } = await awaitWrapTimeout(_client.request(FETCH_USER_DETAIL, userIdJSON));
    if (error) return [null, _graphqlErrorHandler(error)]
    else return [result.findMember, null];
}

async function fetchTeamDetail(teamIdsJSON){
    const { result, error } = await awaitWrapTimeout(_client.request(FETCH_TEAM_DETAIL, teamIdsJSON));
    if (error) return [null, _graphqlErrorHandler(error)]
    else return [result.findTeams, null];
}

async function fetchSkillDetail(skillJSON){
    const { result, error } = await awaitWrapTimeout(_client.request(FETCH_SKILL_DETAIL, skillJSON));
    if (error) return [null, _graphqlErrorHandler(error)]
    else return [result.findSkill, null];
}

async function addSkill(skillNameJSON){
    const { result, error } = await awaitWrapTimeout(_client.request(ADD_SKILL, skillNameJSON));
    if (error) return [null, _graphqlErrorHandler(error)]
    else return [result.createSkill, null];
}

async function matchMemberToUser(memberJSON){
    const { result, error } = await awaitWrapTimeout(_client.request(MATCH_MEMBER_TO_USER, memberJSON));
    if (error) return [null, _graphqlErrorHandler(error)]
    else return [result.matchMembersToUser, null];
}

async function matchMemberToSkill(skillsJSON){
    const { result, error } = await awaitWrapTimeout(_client.request(MATCH_MEMBER_TO_SKILL, skillsJSON));
    if (error) return [null, _graphqlErrorHandler(error)]
    else return [result.matchMembersToSkills, null];
}

async function matchMemberToProject(memberJSON){
    const { result, error } = await awaitWrapTimeout(_client.request(MATCH_MEMBER_TO_PROJECT, memberJSON));
    if (error) return [null, _graphqlErrorHandler(error)]
    else return [result.findProjects_RecommendedToUser, null];
}

async function endorseAttribute(attributeJSON){
    const { result, error } = await awaitWrapTimeout(_client.request(ENDORSE_ATTRIBUTE, attributeJSON));
    if (error) return [null, _graphqlErrorHandler(error)]
    else return [result.endorseAttribute, null];
}

async function createProjectUpdate(projectUpdateJSON){
    const { result, error } = await awaitWrapTimeout(_client.request(CREATE_PROJECT_UPDATE, projectUpdateJSON));
    if (error) return [null, _graphqlErrorHandler(error)]
    else return [result.createProjectUpdate, null];
}

//to-do GraphQL Error Handling
function _graphqlErrorHandler(error){
  if (error.message == CONSTANT.ERROR.TIMEOUT) return CONSTANT.ERROR.TIMEOUT;
  else {
    if (error.response) return error.response.errors[0].message;
    else return error.message
  }
}


module.exports = { 
  fetchServer,
  fetchProjects, 
  fetchSkills, 
  fetchUsers, 
  fetchTeams,
  fetchUnverifiedSkills, 
  addNewMember,
  updateUser, 
  updateServer,
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
  matchMemberToProject,
  endorseAttribute,
  createProjectUpdate,
};