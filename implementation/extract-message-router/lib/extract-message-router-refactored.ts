import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda"
import { Rule } from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3 from 'aws-cdk-lib/aws-s3'

export class ExtractMessageRouterRefactoredStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // downstream lambda functions
    const claimProcessor = new lambda.Function(this, 'ClaimProcessorLambda', {
      functionName: 'ClaimProcessorRefactored',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda/claim-processor'),
      handler: 'index.handler',
    });

    const mediaProcessor = new lambda.Function(this, 'MediaProcessorLambda', {
      functionName: 'MediaProcessorRefactored',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda/media-processor'),
      handler: 'index.handler',
    });

    const defaultProcessor = new lambda.Function(this, 'DefaultProcessorLambda', {
      functionName: 'DefaultProcessorRefactored',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda/default-processor'),
      handler: 'index.handler',
    });

    const bucketName = 'extractmessagerouter-databucketrefactored' + this.account
    const dataBucket = new s3.Bucket(this, 'DataBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: bucketName
    })

    // configure s3 notifications using L1 construct, native implementation creates a custom resource to configure notifications
    const cfnBucket = dataBucket.node.defaultChild as s3.CfnBucket
    cfnBucket.notificationConfiguration = {
      eventBridgeConfiguration: {
        eventBridgeEnabled: true
      }
    }

    // rule for media processor
    const media_rule = new Rule(this, 'MediaRule', {
      eventPattern: {
        detailType: [ "Object Created" ],
        detail: {
          "bucket": {
            "name": [dataBucket.bucketName]
          },
          "object": {
            "key": [ { "prefix": "media/"} ],
            "size": [{"numeric": [">", 0] }]
          },
        }
      }
    }).addTarget(new targets.LambdaFunction(mediaProcessor))
    
    // rule for claim processor
    const claim_rule = new Rule(this, 'ClaimRule', {
      eventPattern: {
        detailType: [ "Object Created" ],
        detail: {
          "bucket": {
            "name": [dataBucket.bucketName]
          },
          "object": {
            "key": [ { "prefix": "claims/"} ],
            "size": [{"numeric": [">", 0] }]
          },
        }
      }
    }).addTarget(new targets.LambdaFunction(claimProcessor))

    // send all records to default processor for tracking purposes
    const default_rule = new Rule(this, 'DefaultRule', {
      eventPattern: {
        detailType: [ "Object Created" ],
        detail: {
          "bucket": {
            "name": [dataBucket.bucketName]
          },
          "object": {
            "size": [{"numeric": [">", 0] }]
          }
        }
      }
    }).addTarget(new targets.LambdaFunction(defaultProcessor))

    new cdk.CfnOutput(this, 'S3BucketName', { value: dataBucket.bucketName });
    
  }
}
