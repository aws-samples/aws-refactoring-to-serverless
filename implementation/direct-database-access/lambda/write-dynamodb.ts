const AWS = require('aws-sdk');
import {v4 as uuid} from 'uuid';

const documentClient = new AWS.DynamoDB.DocumentClient();

export async function main( event: any ) {
  const date: string = new Date().toDateString();
  const time: string = new Date().toTimeString();
  
  let params = {
    TableName : process.env.DatabaseTable,
    Item: {
      orderId: uuid(),
      productType: event.productType,
      orderDate: date,
      orderTime: time
    }
  }
  try {
    await documentClient.put(params).promise();
  }
  catch (err) {
    console.log(err);
    return err;
  }
  return {
    output: 'Success!',
  };
}