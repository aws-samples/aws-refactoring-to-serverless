const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamodbClient = new DynamoDBClient({ region: process.env.REGION });

exports.handler = async (event, context) => {

  // save data to dynamodb table
  const db_params = {
    TableName: process.env.TABLE_NAME,
    Item: {
      orderId: {S: event.orderId},
      productId: {S: event.productId}
    }
  };

  try {
    await dynamodbClient.send(new PutItemCommand(db_params));
    console.log('Successfully inserted item into DynamoDB table.', db_params);
  } catch (err) {
    console.error('Error: ', err);
  }
 
  

};
