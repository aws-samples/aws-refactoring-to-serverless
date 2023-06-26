const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamodbClient = new DynamoDBClient({ region: process.env.REGION });

exports.handler = async (event, context) => {

  // convert order to dyanmodb format
  // save data to dynamodb table
  const db_params = {
    TableName: process.env.TABLE_NAME,
    Item: {
      orderId: {S: event.orderId},
      items: {L : event.items.map(x => ({S: x}))}
    }
  };

  try {
    await dynamodbClient.send(new PutItemCommand(db_params));
    console.log('Successfully inserted item into DynamoDB table.', JSON.stringify(db_params));
  } catch (err) {
    console.error('Error: ', err);
  }
 
  

};
