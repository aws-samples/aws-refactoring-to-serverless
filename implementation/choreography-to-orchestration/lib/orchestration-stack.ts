import { Construct } from "constructs";
import {
  Stack,
  StackProps,
  aws_lambda as lambda,
  aws_apigateway as apigateway,
  aws_iam as iam,
  aws_dynamodb as dynamodb,
  aws_sns as sns,
  aws_sqs as sqs,
  aws_lambda_destinations as destinations,
  aws_lambda_event_sources as sources,
  aws_stepfunctions as sfn,
  aws_stepfunctions_tasks as tasks,
  CfnOutput,
} from "aws-cdk-lib";
import { NagSuppressions } from 'cdk-nag'


export class OrchestrationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    NagSuppressions.addStackSuppressions(this, [
      {
        id: 'AwsSolutions-IAM4',
        reason: 'This is a demo application, allowing use of AWS Managed policies'
      },
      { 
        id: 'AwsSolutions-SF1', 
        reason: 'This is demo stack, hence not enabling Cloudwatch logging from StepFunction' 
      },
      { 
        id: 'AwsSolutions-SF2', 
        reason: 'This is demo stack, hence not enabling X-Ray tracing' 
      },
    ]);

    const ResourceFunction1 = new lambda.Function(this, "ResourceFunction1", {
      description: "",
      functionName: "RecommendationResource1",
      handler: "Resource.lambda_handler",
      code: lambda.Code.fromAsset("lambda"),
      memorySize: 128,
      runtime: lambda.Runtime.PYTHON_3_9,
    });

    const ResourceFunction2 = new lambda.Function(this, "ResourceFunction2", {
      description: "",
      functionName: "RecommendationResource2",
      handler: "Resource.lambda_handler",
      code: lambda.Code.fromAsset("lambda"),
      memorySize: 128,
      runtime: lambda.Runtime.PYTHON_3_9,
    });

    const ResourceFunction3 = new lambda.Function(this, "ResourceFunction3", {
      description: "",
      functionName: "RecommendationResource3",
      handler: "Resource.lambda_handler",
      code: lambda.Code.fromAsset("lambda"),
      memorySize: 128,
      runtime: lambda.Runtime.PYTHON_3_9,
    });

    const stateMachineRole = new iam.Role(this, "Resource Role", {
      assumedBy: new iam.ServicePrincipal("states.amazonaws.com"),
    });

    stateMachineRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: [ResourceFunction1.functionArn, ResourceFunction2.functionArn, ResourceFunction3.functionArn],
      })
    );

    const StepFunctionsStateMachine = new sfn.CfnStateMachine(this, 'StepFunctionsStateMachine', {
      stateMachineName: "MyStateMachine-klj0017ra",
      definitionString: `
{
  "Comment": "A description of my state machine",
  "StartAt": "Pass",
  "States": {
    "Pass": {
      "Type": "Pass",
      "Next": "Parallel"
    },
    "Parallel": {
      "Type": "Parallel",
      "Branches": [
        {
          "StartAt": "RecommendationResource-1",
          "States": {
            "RecommendationResource-1": {
              "Type": "Task",
              "Resource": "arn:aws:states:::lambda:invoke",
              "OutputPath": "$.Payload",
              "Parameters": {
                "Payload.$": "$",
                "FunctionName": "${ResourceFunction1.functionArn}"
              },
              "Retry": [
                {
                  "ErrorEquals": [
                    "Lambda.ServiceException",
                    "Lambda.AWSLambdaException",
                    "Lambda.SdkClientException",
                    "Lambda.TooManyRequestsException"
                  ],
                  "IntervalSeconds": 2,
                  "MaxAttempts": 6,
                  "BackoffRate": 2
                }
              ],
              "End": true
            }
          }
        },
        {
          "StartAt": "RecommendationResource-2",
          "States": {
            "RecommendationResource-2": {
              "Type": "Task",
              "Resource": "arn:aws:states:::lambda:invoke",
              "OutputPath": "$.Payload",
              "Parameters": {
                "Payload.$": "$",
                "FunctionName": "${ResourceFunction2.functionArn}"
              },
              "Retry": [
                {
                  "ErrorEquals": [
                    "Lambda.ServiceException",
                    "Lambda.AWSLambdaException",
                    "Lambda.SdkClientException",
                    "Lambda.TooManyRequestsException"
                  ],
                  "IntervalSeconds": 2,
                  "MaxAttempts": 6,
                  "BackoffRate": 2
                }
              ],
              "End": true
            }
          }
        },
        {
          "StartAt": "RecommendationResource-3",
          "States": {
            "RecommendationResource-3": {
              "Type": "Task",
              "Resource": "arn:aws:states:::lambda:invoke",
              "OutputPath": "$.Payload",
              "Parameters": {
                "Payload.$": "$",
                "FunctionName": "${ResourceFunction3.functionArn}"
              },
              "Retry": [
                {
                  "ErrorEquals": [
                    "Lambda.ServiceException",
                    "Lambda.AWSLambdaException",
                    "Lambda.SdkClientException",
                    "Lambda.TooManyRequestsException"
                  ],
                  "IntervalSeconds": 2,
                  "MaxAttempts": 6,
                  "BackoffRate": 2
                }
              ],
              "End": true
            }
          }
        }
      ],
      "ResultSelector": {
        "Quotes.$": "$"
      },
      "End": true
    }
  }
}
`,
      roleArn: stateMachineRole.roleArn,
      stateMachineType: "STANDARD",
      loggingConfiguration: {
        includeExecutionData: false,
        level: "OFF"
      }
    });

    new CfnOutput(this, 'State Machine ARN: ', { value: StepFunctionsStateMachine.attrArn });

  }
}
