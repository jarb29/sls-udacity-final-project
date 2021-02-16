import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import 'source-map-support/register'
import * as AWSXRay from 'aws-xray-sdk'

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { createLogger } from '../utils/logger'

const logger = createLogger('todosAccess')

const XAWS = AWSXRay.captureAWS(AWS)

export class GroupAccess {

  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosIndex = process.env.TODOS_TABLE_ITEM,
    private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
    private readonly bucket = process.env.GENERATE_UPLOAD_URL,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION
  ) {}

  async todoItemExists(todoId: string): Promise<boolean> {
    const item = await this.getTodoItem(todoId)
    return !!item
  }
  
  async getAttachmentUrl(attachId: string): Promise<string> {
    const attachmentUrl = `https://${this.bucket}.s3.amazonaws.com/${attachId}`
    return attachmentUrl
  }
  
  async getUrl(attachId: string): Promise<string> {
  const uploadUrl = this.s3.getSignedUrl('putObject', {
    Bucket: this.bucket,
    Key: attachId,
    Expires: parseInt(this.urlExpiration)
  })
  return uploadUrl
  }

  async getTodoItems(userId: string): Promise<TodoItem[]> {
    logger.info(`Getting all todos for user ${userId} from ${this.todosTable}`)

    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.todosIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise()

    const items = result.Items

    logger.info(`Found ${items.length} todos for user ${userId} in ${this.todosTable}`)

    return items as TodoItem[]
  }

  async getTodoItem(todoId: string): Promise<TodoItem> {
    logger.info(`Getting ${todoId} from ${this.todosTable}`)

    const result = await this.docClient.get({
      TableName: this.todosTable,
      Key: {
        todoId: todoId
      }
    }).promise()

    logger.info(`Getting ${todoId} from ${result.Item}`)
    const item = result.Item
    return item as TodoItem
  }

  
  async createTodo(todoItem: TodoItem) {
    logger.info(`adding ${todoItem.todoId} for ${this.todosTable}`)

    await this.docClient.put({
      TableName: this.todosTable,
      Item: todoItem,
    }).promise()
  }

  async updateTodoItem(todoId: string, todoUpdate: TodoUpdate) {
    logger.info(`Updating todo item ${todoId} in ${this.todosTable}`)

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        todoId
      },
      UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
      ExpressionAttributeNames: {
        "#name": "name"
      },
      ExpressionAttributeValues: {
        ":name": todoUpdate.name,
        ":dueDate": todoUpdate.dueDate,
        ":done": todoUpdate.done
      }
    }).promise()   
  }

  async deleteTodo(todoId: string) {
    logger.info(`Deleting todo item ${todoId} from ${this.todosTable}`)

    await this.docClient.delete({
      TableName: this.todosTable,
      Key: {
        todoId: todoId
      }
    }).promise()    
  }

  async updateAttachmentUrl(todoId: string, attachmentUrl: string) {
    logger.info(`Updating attachment URL for todo ${todoId} in ${this.todosTable}`)

    await this.docClient.update({
      TableName: this.todosTable,
      Key: {
        todoId
      },
      UpdateExpression: 'set attachmentUrl = :attachmentUrl',
      ExpressionAttributeValues: {
        ':attachmentUrl': attachmentUrl
      }
    }).promise()
  }

  async ifUserExists(userId: string) {

    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.todosIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise()
  
    console.log('Get group: ', !!result.Items)
    return !!result.Items
    
  }

  async getTodo(userId: string) {
    const result = await this.docClient.query({
      TableName: this.todosTable,
      IndexName: this.todosIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false
    }).promise()
  
    return result.Items as TodoItem[]
  }

}

// New file
