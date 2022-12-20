const AWS = require('aws-sdk');

const documentClient = new AWS.DynamoDB.DocumentClient();

export async function main( event: any ) {
  let data: string;
  
  let params = {
    TableName : process.env.DatabaseTable,
    Key: {
      "orderId" : event.orderId
    }
  }
  
  try {
    data = await documentClient.get(params).promise();
  }
  catch (err) {
    console.log(err);
    return err;
  }
  return {
    output: data,
  };
}