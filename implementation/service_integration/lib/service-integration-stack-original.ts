import { Stack, StackProps, RemovalPolicy, Duration, CfnOutput } from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';


export class ServiceIntegrationStackOriginal extends Stack {
  private IMAGE_TO_LABEL: String = '255911618.jpeg';

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const imageBucket = new s3.Bucket(this, 'DestinationBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      enforceSSL: true
    });

    const s3BucketDeployLambdaRole = new iam.Role(this, 'S3BucketDeployDefaultLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    })
    s3BucketDeployLambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/ServiceIntegrationStack*'],
    }))

    new s3deploy.BucketDeployment(this, 'DeployImage', {  
      sources: [s3deploy.Source.asset('./images')],
      destinationBucket: imageBucket,
      role: s3BucketDeployLambdaRole
    });

    const detectObjectInImageLambdaRole = new iam.Role(this, 'detectObjectInImageLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    detectObjectInImageLambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/detectObjectInImage:*'],
    }))

    detectObjectInImageLambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        "s3:GetObject",
        "rekognition:DetectLabels"],
      resources: ['*'] //rekognition requires 'all'
    }))

    const detectObjectInImageLambda = new lambda.Function(this, 'detectObjectInImage', {
      functionName: 'detectObjectInImage',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda-fns'),
      handler: 'detectObjectInImage.handler',
      role: detectObjectInImageLambdaRole
    });

    


    const detectObject = new tasks.LambdaInvoke(this, 'Detect Object', {
      lambdaFunction: detectObjectInImageLambda,
      payload: sfn.TaskInput.fromObject({
        s3Bucket: imageBucket.bucketName,
        imageName: this.IMAGE_TO_LABEL
      }),
      outputPath: "$.Payload"
    });

    const extractName = new sfn.Pass(this, 'Extract Name', {
      parameters: {
        "contains.$": "$.Labels[0].Name"
      }
    });

    const failed = new sfn.Fail(this, 'Quality Control Failed');
    const passed = new sfn.Succeed(this, 'Quality Control Passed');


    const definition = detectObject
      .next(extractName)
      .next(new sfn.Choice(this, 'Is Pizza?')
        .when(sfn.Condition.stringEquals('$.contains', 'Pizza'), passed)
        .otherwise(failed)
      )

    const stepFunction = new sfn.StateMachine(this, 'workflow', {
      stateMachineName: 'FoodQualityControl-Original',
      definition: definition,
      timeout: Duration.seconds(30)
    });

    new CfnOutput(this, 'ArnForStepFunction-Orginal', { value: stepFunction.stateMachineArn });

  }

}
