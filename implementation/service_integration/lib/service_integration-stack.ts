import { Construct } from 'constructs';
import { Stack, StackProps,RemovalPolicy,Duration, aws_rekognition, CfnOutput } from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda"
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as iam from 'aws-cdk-lib/aws-iam';





//https://catfact.ninja/fact
//json {"fact":"The silks ..","length":174}

export class ServiceIntegrationStack extends Stack {
  private IMAGE_TO_LABEL: String = 'reinvent_andy_jassy.png';

  private imageBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.imageBucket = new s3.Bucket(this, 'DestinationBucket', {
      bucketName: "refactoring-service-integration-bucket",
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const s3Object = new s3deploy.BucketDeployment(this, 'DeployImage', {
      sources: [s3deploy.Source.asset('./images')],
      destinationBucket: this.imageBucket,
    });

    this.callRekognitionFromLambda();
    this.directRekognitionIntegration();
  }
  
    private callRekognitionFromLambda() {
   
      const getDataFromAPI = new Function(this, 'ExtractMetadataUsingRekognition', {
        functionName: `ExtractMetadataUsingRekognition`,
        runtime: Runtime.NODEJS_14_X,           
        code: Code.fromAsset('lambda-fns'),         
        handler: 'extractDataUsingRekognition.handler',
      });

      const rekognitionPolicy = new iam.PolicyStatement({
        actions:[
          "s3:GetObject",
          "rekognition:DetectLabels"],
        resources:['*']
      })

      getDataFromAPI.addToRolePolicy(rekognitionPolicy)
  
      const lambdaStepFunction = new sfn.StateMachine(this, 'workflowWithLambda', {
        definition: new tasks.LambdaInvoke(this, 'Call API with Lambda', {
          lambdaFunction: getDataFromAPI,
          payload: sfn.TaskInput.fromObject({
            s3Bucket: this.imageBucket.bucketName,
            imageName: this.IMAGE_TO_LABEL
          }),
        
          outputPath: '$.Payload',
        }),
        timeout: Duration.seconds(30),
        tracingEnabled: true,
      
      });

      new CfnOutput(this,'ArnForLambdaIntegration',{
        value: lambdaStepFunction.stateMachineArn,
        description: 'ARN for executiong the StepFunction from AWS CLI'
      });
  
    }
    
    private directRekognitionIntegration() {
      const serviceIntegrationStepFunction = new sfn.StateMachine(this, 'directServiceCall', {
        definition: new tasks.CallAwsService(this, 'detectLabels',{
          service: 'rekognition',
          action: 'detectLabels',
          parameters: {
            Image: {
              S3Object: {
                Bucket: this.imageBucket.bucketName,
                Name: this.IMAGE_TO_LABEL
              }
            },
            MaxLabels: 5,
		        MinConfidence: 80
        },
      iamResources:['*']
      }),
      timeout:Duration.seconds(30)
    })
    // created feature request for CallAwsService to auto detects the required roles based on service:action
    this.imageBucket.grantRead(serviceIntegrationStepFunction);

    new CfnOutput(this,'ArnForServiceIntegration',{
      value: serviceIntegrationStepFunction.stateMachineArn,
      description: 'ARN for executiong the StepFunction from AWS CLI'
    });
  }
    
}
