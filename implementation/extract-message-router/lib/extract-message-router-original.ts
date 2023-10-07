import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as iam from 'aws-cdk-lib/aws-iam';

export class ExtractMessageRouterOriginalStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
      }
    });

    // allow router invoke downstream lambdas
    router.addToRolePolicy(new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [claimProcessor.functionArn, mediaProcessor.functionArn, defaultProcessor.functionArn]
    }))

    const bucketName = 'extractmessagerouter-databucketoriginal' + this.account
    const dataBucket = new s3.Bucket(this, 'DataBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      bucketName: bucketName
    })
    
    const lambdaPermission = new lambda.CfnPermission(this, 'routerLambdaS3Permission', {
      action: 'lambda:InvokeFunction',
      functionName: router.functionArn,
      principal: 's3.amazonaws.com',
      sourceAccount: this.account,
      sourceArn: "arn:aws:s3:::" + bucketName
    })

    dataBucket.node.addDependency(lambdaPermission)

    // configure s3 notifications using L1 construct, native implementation creates a custom resource to configure notifications
    const cfnBucket = dataBucket.node.defaultChild as s3.CfnBucket
    cfnBucket.notificationConfiguration = {
      lambdaConfigurations: [{
        event: "s3:ObjectCreated:*",
        function: router.functionArn
      }]
    }

    new cdk.CfnOutput(this, 'S3BucketName', { value: dataBucket.bucketName });
  }
}
