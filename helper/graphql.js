const {gql, GraphQLClient} = require("graphql-request")
const { awaitWrap } = require("./util");
const CONSTANT = require("./const");

const client = new GraphQLClient(CONSTANT.URL.GRAPHQL, { headers: {} })

const GET_PROJECTS = gql`
    query{
        findProjects(fields:{}){
            _id
            tagName
            title
            description
            dates{
                kickOff
                complition
            }
            budget{
                token
                perHour
            }
            collaborationLinks {
                title
                link
            }
            champion {
                discordName
                discordID
            }
            team{
                members{
                    discordName
                    discordID
                }
                roleID
            }
            role {
            title
            description
            skills {
                skill{
                    tagName
                }
                level
            }
            budget {
                token
            }
        }
    }
}
`;

const GET_SKILLS = gql`
    query{
        findSkills(fields:{
        }){
            _id
            tagName
            members{
                discordName
            }
        }
    }
`;

async function fetchProjects(){
    const {result, error} = await awaitWrap(client.request(GET_PROJECTS));
    if (error) return [null, error]
    else return [result.findProjects, null]
}

async function fetchSkills() {
    const { result, error } = await awaitWrap(client.request(GET_SKILLS));
    if (error) return [null, error]
    else return [result.findSkills, null]
}


module.exports = {fetchProjects, fetchSkills}

