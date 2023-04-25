import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources'


export class ExtractMessageFilterOriginalStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dataBucket = new s3.Bucket(this, 'DataBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    // downstream lambda functions
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

    // router lambda function 
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

    // configure S3 notifications
    router.addEventSource(new eventsources.S3EventSource(dataBucket, {
      events: [s3.EventType.OBJECT_CREATED]
    }))

    claimProcessor.grantInvoke(router)
    mediaProcessor.grantInvoke(router)
    defaultProcessor.grantInvoke(router)

    new cdk.CfnOutput(this, 'S3BucketName', { value: dataBucket.bucketName });
  }
}
