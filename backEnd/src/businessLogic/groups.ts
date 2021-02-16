import 'source-map-support/register'
import { GroupAccess } from '../dataLayer/groupsAccess'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'

const logger = createLogger('todos')

const groupAccess = new GroupAccess()

export async function getTodos(userId: string): Promise<TodoItem[]> {
  logger.info(`Getting todos for: ${userId}`, { userId })

  return await groupAccess.getTodoItems(userId)
}

export async function createTodoItem(userId: string, createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
  const todoId = uuid.v4()

  const newTodoItem: TodoItem = {
    userId,
    todoId,
    done: false,
    createdAt: new Date().toISOString(),
    attachmentUrl: null,
    ...createTodoRequest
  }

  logger.info(`The user ${userId}, created the following ${todoId} `, { userId, todoId, todoItem: newTodoItem })
  await groupAccess.createTodo(newTodoItem)

  return newTodoItem
}

export async function updateTodo(userId: string, todoId: string, updateTodoRequest: UpdateTodoRequest) {
  logger.info(`Updating ${todoId} for ${userId}`, { userId, todoId, todoUpdate: updateTodoRequest })

  const item = await groupAccess.getTodoItem(todoId)

  if (!item)
    throw new Error('Not found') 

  if (item.userId !== userId) {
    logger.error(`User ${userId} does not have permission to update todo ${todoId}`)
    throw new Error('User is not authorized to update item') 
  }

  groupAccess.updateTodoItem(todoId, updateTodoRequest as TodoUpdate)
}

export async function deleteTodoItem(userId: string, todoId: string) {
  logger.info(`delete ${todoId} for: ${userId}`, { userId, todoId })

  const item = await groupAccess.getTodoItem(todoId)

  logger.info(`ITEM: ${item }`)

  if (!item)
    throw new Error(`${item} not found`) 

  if (item.userId !== userId) {
    logger.error(`User ${userId} can't delete ${todoId}`)
    throw new Error(`${userId} can't delete ${todoId}`)  
  }

  groupAccess.deleteTodo(todoId)
}

export async function updateAttachUrl(userId: string, todoId: string, attachtId: string) {

  const attachmentUrl = await groupAccess.getAttachmentUrl(attachtId)

  logger.info(`Updating todo ${todoId} with attachment URL ${attachmentUrl}`, { userId, todoId })

  const item = await groupAccess.getTodoItem(todoId)

  if (!item)
    throw new Error('Could not found') 

  if (item.userId !== userId) {
    logger.error(`User ${userId} does not have permission to update todo ${todoId}`)
    throw new Error('User is not authorized to update item') 
  }

  await groupAccess.updateAttachmentUrl(todoId, attachmentUrl)
}

export async function generatedUrl(attachtId: string): Promise<string> {
  logger.info(`URL for ${attachtId}`)
  const uploadUrl = await groupAccess.getUrl(attachtId)
  return uploadUrl
}

export async function ifUserExists(userId: string): Promise<boolean> {
  logger.info(`knowing if User ${userId}, exist`)
  const userExist = await groupAccess.ifUserExists(userId)

  logger.info(`Result after ${userExist}, ifuserexist`)
  return userExist
}

export async function getTodo(userId: string): Promise<TodoItem[]> {
  logger.info(`knowing if User ${userId}, exist`)
  const todoItems = await groupAccess.getTodo(userId)
  return todoItems
}




// New file