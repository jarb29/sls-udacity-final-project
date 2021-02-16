import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import { ifUserExists } from '../../businessLogic/groups'
import { getTodo } from '../../businessLogic/groups'
import { getUserId } from '../utils'




// TODO: Get all TODO items for a current user
export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  // const userId = event.pathParameters.userId
  const userId = getUserId(event)

  const validuserId = await ifUserExists(userId)


  if (!validuserId) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'User does not exist'
      })
    }
  }

  const userTodos = await getTodo(userId)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      items: userTodos
    })
  }
}