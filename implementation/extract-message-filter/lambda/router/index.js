const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambdaClient = new LambdaClient();

exports.handler = async (event, context) => {
  // Process each record in the S3 notification event
  for (const record of event.Records) {
       
    const objectKey = record.s3.object.key;
    const objectSize = record.s3.object.size;
    const eventName = record.eventName

    // process only ObjectCreated:Put events
    // ignore directories (size > 0)
    if ('ObjectCreated:Put' === eventName && objectSize > 0) {

      // send all records to default processor for tracking purposes
      const invokeCommand = new InvokeCommand({
        FunctionName: process.env.default_processor_lambda,
        InvocationType: 'Event', // Use 'Event' for asynchronous invocation
        Payload: JSON.stringify(record) // Pass data as payload to the invoked Lambda function
      });
      
      await lambdaClient.send(invokeCommand);
      console.log('Invoked default processor lambda function');

      // process files uploaded to "media/" directory
      if (objectKey.startsWith('media/')) {
        const invokeCommand = new InvokeCommand({
          FunctionName: process.env.media_processor_lambda,
          InvocationType: 'Event', // Use 'Event' for asynchronous invocation
          Payload: JSON.stringify(record) // Pass data as payload to the invoked Lambda function
        });
        
        await lambdaClient.send(invokeCommand);
        console.log('Invoked media processor lambda function.');  
      }    
      // process files uploaded to "claims/" directory
      else if (objectKey.startsWith('claims/')) {
        const invokeCommand = new InvokeCommand({
          FunctionName: process.env.claim_processor_lambda,
          InvocationType: 'Event', 
          Payload: JSON.stringify(record)
        });
        
        await lambdaClient.send(invokeCommand);
        console.log('Invoked claims processor lambda function');
      }
    }
    else {
      console.log('Object size 0, skipping processing');
    }
  }
};
