import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from "aws-cdk-lib/aws-lambda"
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class ExtractMessageFilterOriginalStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    const recordsTable = new dynamodb.Table(this, 'RecordsTable', {
      tableName: 'RecordsTableOriginal',
      partitionKey: {
        name:'recordId', 
        type: dynamodb.AttributeType.STRING
      },
      // enable streams
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const claimProcessor = new lambda.Function(this, 'ClaimProcessorLambda', {
      functionName: 'ClaimProcessorOriginal',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda/claim-processor'),
      handler: 'index.handler',
    });

    const mediaProcessor = new lambda.Function(this, 'MediaProcessorLambda', {
      functionName: 'MediaProcessorOriginal',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda/media-processor'),
      handler: 'index.handler',
    });

    const defaultProcessor = new lambda.Function(this, 'DefaultProcessorLambda', {
      functionName: 'DefaultProcessorOriginal',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda/default-processor'),
      handler: 'index.handler',
    });

    const router = new lambda.Function(this, 'RouterLambda', {
      functionName: 'Router',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda/router'),
      handler: 'index.handler',
      environment: {
        claim_processor_lambda: claimProcessor.functionName,
        media_processor_lambda: mediaProcessor.functionName,
        default_processor_lambda: defaultProcessor.functionName
      },
    });

    router.addEventSource(new DynamoEventSource(recordsTable, {
      startingPosition: lambda.StartingPosition.LATEST
    }))

    claimProcessor.grantInvoke(router)
    mediaProcessor.grantInvoke(router)
    defaultProcessor.grantInvoke(router)
  }
}
