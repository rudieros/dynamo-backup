import * as AWS from 'aws-sdk'
import * as fs from 'fs'

const dynamo = new AWS.DynamoDB({ region: 'us-east-1' })
const db = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-1',
})

const restore = async () => {
  const oldTableNames = fs.readdirSync(`${__dirname}/backups`)
  if (!oldTableNames) {
    return
  }
  await Promise.all(oldTableNames.map(async (tableNameWithExtension: any) => {
    const tableName = tableNameWithExtension.replace('.json', '')
    const data = fs.readFileSync(`${__dirname}/backups/${tableNameWithExtension}`).toString()
    const itemsToPut = JSON.parse(data)

    let initialPosition = 0
    let nextItems = [...itemsToPut].slice(initialPosition, 25)
    // const keyModel = await dynamo.describeTable({
    //   TableName: tableName,
    // }).promise()
    while (nextItems.length) {
      await db.batchWrite({
        RequestItems: {
          [`${tableName}V2`]: itemsToPut.map((item: any) => ({
            PutRequest: {
              Item: item,
            }
          }))
        }
      }).promise()
      initialPosition += 25
      nextItems = [...itemsToPut].slice(initialPosition, initialPosition + 25)
    }
  }))
}

restore()

