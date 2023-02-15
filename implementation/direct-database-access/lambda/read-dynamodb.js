const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall} = require('@aws-sdk/util-dynamodb');


const dynamodbClient = new DynamoDBClient();


exports.handler = async function (event, context) {

  try {
    if(event.orderId) {
      var params = {
        TableName : process.env.DatabaseTable,
        Key: marshall({
          'orderId' : event.orderId
        })
     }
      const data = await dynamodbClient.send(new GetItemCommand(params));
      return data;
    }
    return 
  }
  catch (err) {
    console.log(err);
    return err;
  }
  
}