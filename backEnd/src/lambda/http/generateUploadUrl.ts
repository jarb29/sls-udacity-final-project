import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import * as uuid from 'uuid'

import { generatedUrl, updateAttachUrl } from '../../businessLogic/groups'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'

const logger = createLogger('generatedUrl')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  logger.info('Generating Url event', { event })

  const attachId = uuid.v4()
  const userId = getUserId(event)
  const todoId = event.pathParameters.todoId
  const uploadUrl = await generatedUrl(attachId)

  await updateAttachUrl(userId, todoId, attachId)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      uploadUrl
    })
  }
}