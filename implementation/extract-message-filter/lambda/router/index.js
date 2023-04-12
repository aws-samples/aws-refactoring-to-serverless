const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const dynamoDBClient = new DynamoDBClient();
const lambdaClient = new LambdaClient();

exports.handler = async (event, context) => {
  // Process each record in the DynamoDB stream event
  for (const item of event.Records) {
    // Extract the new image from the record
    const newImage = item.dynamodb.NewImage;
    
    // Unmarshall the new image to convert it to a JavaScript object
    const record = unmarshall(newImage);

    // record type (claim, image)
    const type = record.type;
    const claimId = record.claimId;
    const mediaType = record.mediaType;

    if ('claim' === type && claimId && claimId.trim() !== '') {
      const invokeCommand = new InvokeCommand({
        FunctionName: process.env.claim_processor_lambda,
        InvocationType: 'Event', // Use 'Event' for asynchronous invocation
        Payload: JSON.stringify(record) // Pass data as payload to the invoked Lambda function
      });
      
      await lambdaClient.send(invokeCommand);
      console.log('Invoked claim processor lambda function.');
    }
    else if ('media' === type && ['image', 'video', 'pdf'].includes(mediaType)) {
      const invokeCommand = new InvokeCommand({
        FunctionName: process.env.media_processor_lambda,
        InvocationType: 'Event', // Use 'Event' for asynchronous invocation
        Payload: JSON.stringify(record) // Pass data as payload to the invoked Lambda function
      });
      
      await lambdaClient.send(invokeCommand);
      console.log('Invoked media processor lambda function');
    }
    else {
      const invokeCommand = new InvokeCommand({
        FunctionName: process.env.default_processor_lambda,
        InvocationType: 'Event', // Use 'Event' for asynchronous invocation
        Payload: JSON.stringify(record) // Pass data as payload to the invoked Lambda function
      });
      
      await lambdaClient.send(invokeCommand);
      console.log('Invoked default processor lambda function');
    }
  }
};
