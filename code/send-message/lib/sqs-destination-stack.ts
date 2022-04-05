import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { SqsDestination } from 'aws-cdk-lib/aws-lambda-destinations';

export class SqsDestinationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sqsChannel = new sqs.Queue(this, 'PostProcessingQueue',{
      queueName: "PostProcessingQueue"
    });

    const beforeDestinationLambda = new lambda.Function(this, 'BeforeDestinationLambdaHandler', {
      functionName: `SendMessageInCode`,
      runtime: lambda.Runtime.NODEJS_14_X,           
      code: lambda.Code.fromAsset('lambda/before'),         
      handler: 'SendMessageInCode.handler',           
      environment: {
        QUEUE_URL: sqsChannel.queueUrl
      },
    });

    sqsChannel.grantSendMessages(beforeDestinationLambda);


     
    const AfterDestinationLambdaHandler = new lambda.Function(this, 'AfterDestinationLambdaHandler', {
      functionName: `SendMessageUsingDestination`,
      runtime: lambda.Runtime.NODEJS_14_X,           // execution environment
      code: lambda.Code.fromAsset('lambda/after'),         // code loaded from "lambda" directory
      handler: 'SendMessageUsingDestination.handler',                // file name = "destination", function = "handler"
      onSuccess: new SqsDestination(sqsChannel)      // similar to onSuccess, you can send message onFailure
    });

    

  }
}
