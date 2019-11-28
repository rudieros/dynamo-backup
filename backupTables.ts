import * as AWS from 'aws-sdk'
import fs from 'fs'

const dynamo = new AWS.DynamoDB({ region: 'us-east-1' })
const db = new AWS.DynamoDB.DocumentClient({
  region: 'us-east-1',
})

const backup = async () => {
  const tables = await dynamo.listTables().promise()
  if (!tables.TableNames) {
    return
  }
  await Promise.all(tables.TableNames.map(async (TableName: any) => {
    if (!TableName.toLowerCase().includes('prod')) {
      return
    }
    let lastKey: any = undefined
    const items: any[] = []
    do {
      const fetchedItems = await db.scan({
        TableName,
        ExclusiveStartKey: lastKey,
      }).promise()
      items.push(...fetchedItems.Items)
      lastKey = fetchedItems.LastEvaluatedKey
    } while (lastKey)
    fs.writeFileSync(`${__dirname}/backups/${TableName}.json`, JSON.stringify(items, null, 1))
  }))
}

backup()

