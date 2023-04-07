const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

const dynamodbClient = new DynamoDBClient({ region: process.env.REGION });
const eventBridgeClient = new EventBridgeClient({ region: process.env.REGION });

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

    // send event to EB for further processing
    const eb_params = {
      Entries: [
        {
          Source: 'my-source',
          DetailType: 'order-details',
          Detail: JSON.stringify({
            orderId: event.orderId,
            productId: event.productId
          }),
          EventBusName: process.env.EVENT_BUS_NAME
        },
      ],
    };

    await eventBridgeClient.send(new PutEventsCommand(eb_params));
    console.log('Event sent to EventBridge:', eb_params);
  
  } catch (err) {
    console.error('Error: ', err);
  }
 
  

};
