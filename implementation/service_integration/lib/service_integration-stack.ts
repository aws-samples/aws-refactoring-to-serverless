import { Stack, StackProps,RemovalPolicy,Duration, CfnOutput } from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';



export class ServiceIntegrationStack extends Stack {
  private IMAGE_TO_LABEL: String = 'people.png';

  private imageBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.imageBucket = new s3.Bucket(this, 'DestinationBucket', {
      bucketName: "service-integration-bucket",
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const s3Object = new s3deploy.BucketDeployment(this, 'DeployImage', {
      sources: [s3deploy.Source.asset('./images')],
      destinationBucket: this.imageBucket,
    });

     //Before: Making all from StepFuntion to a Lambda, which then calls Rekognition
    this.detectCelebritiesUsingLambda();

     //After Refactoring: Using StepFuction's ServiceIntegration to call Rekognition
    this.detectCelebritiesUsingServiceIntegration();
  }
  
 
    private detectCelebritiesUsingLambda() {
      const detectCelebrityInImage = new lambda.Function(this, 'detectCelebrityInImage', {
        functionName: 'detectCelebrityInImage',
        runtime: lambda.Runtime.NODEJS_14_X,           
        code: lambda.Code.fromAsset('lambda-fns'),         
        handler: 'detectCelebrity.handler'
      });

      const rekognitionPolicy = new iam.PolicyStatement({
        actions:[
          "s3:GetObject",
          "rekognition:RecognizeCelebrities"],
          resources: ['*'] //rekognition requires 'all'
        })

      detectCelebrityInImage.addToRolePolicy(rekognitionPolicy)
  
      const stepFunction = new sfn.StateMachine(this, 'workflow', {
        stateMachineName: 'detectCelebrityUsingLambda',
        definition: new tasks.LambdaInvoke(this, 'lambda', {
          lambdaFunction: detectCelebrityInImage,
          payload: sfn.TaskInput.fromObject({
            s3Bucket: this.imageBucket.bucketName,
            imageName: this.IMAGE_TO_LABEL
          }),
          outputPath: '$.Payload',
        }),
        timeout: Duration.seconds(30)      
      });

      new CfnOutput(this,'ArnForLambdaIntegration',{value: stepFunction.stateMachineArn});
  
    }
    
    private detectCelebritiesUsingServiceIntegration() {
      const stepFunction = new sfn.StateMachine(this, 'directServiceCall', {
        stateMachineName: 'detectCelebrityUsingServiceAPI',
        definition: new tasks.CallAwsService(this, 'RecognizeCelebrities',{
          service: 'rekognition',
          action: 'recognizeCelebrities',
          parameters: {
            Image: {
              S3Object: {
                Bucket: this.imageBucket.bucketName,
                Name: this.IMAGE_TO_LABEL
              }
            }
          },
          iamResources:['*'],          
          additionalIamStatements: [
            new iam.PolicyStatement({
            actions: ['s3:getObject'],
            resources: [`${this.imageBucket.bucketArn}/${this.IMAGE_TO_LABEL}`]
            })
          ],
          outputPath: '$.CelebrityFaces..Name'
      }),
      timeout: Duration.seconds(30)
    })

    new CfnOutput(this,'ArnForServiceIntegration',{value: stepFunction.stateMachineArn });
  }
    
}
