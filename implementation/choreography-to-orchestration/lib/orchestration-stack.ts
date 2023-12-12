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

    const ProcessPaymentFunction = new lambda.Function(this, "ProcessPaymentFunction", {
      description: "",
      functionName: "ProcessPaymentFunction",
      handler: "ProcessPayment.lambda_handler",
      code: lambda.Code.fromAsset("lambda/orchestration"),
      memorySize: 128,
      runtime: lambda.Runtime.PYTHON_3_10,
    });

    const ShipOrderFunction = new lambda.Function(this, "ShipOrderFunction", {
      description: "",
      functionName: "ShipOrderFunction",
      handler: "ShipOrder.lambda_handler",
      code: lambda.Code.fromAsset("lambda/orchestration"),
      memorySize: 128,
      runtime: lambda.Runtime.PYTHON_3_10,
    });

    const UpdateRewardFunction = new lambda.Function(this, "UpdateRewardFunction", {
      description: "",
      functionName: "UpdateRewardFunction",
      handler: "UpdateReward.lambda_handler",
      code: lambda.Code.fromAsset("lambda/orchestration"),
      memorySize: 128,
      runtime: lambda.Runtime.PYTHON_3_10,
    });

    const DynamoDBTable = new dynamodb.CfnTable(this, "DynamoDBTable", {
      attributeDefinitions: [
        {
          attributeName: "product_id",
          attributeType: "S",
        }
      ],
      tableName: "store-order-data",
      keySchema: [
        {
          attributeName: "product_id",
          keyType: "HASH",
        }
      ],
      provisionedThroughput: {
        readCapacityUnits: 1,
        writeCapacityUnits: 1,
      },
    });

    const stateMachineRole = new iam.Role(this, "Resource Role", {
      assumedBy: new iam.ServicePrincipal("states.amazonaws.com"),
    });

    stateMachineRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: [ProcessPaymentFunction.functionArn, ShipOrderFunction.functionArn, UpdateRewardFunction.functionArn],
      })
    );

    stateMachineRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:PutItem"],
        resources: [DynamoDBTable.attrArn],
      })
    );

    const StepFunctionsStateMachine = new sfn.CfnStateMachine(this, 'StepFunctionsStateMachine', {
      stateMachineName: "MyStateMachine-klj0017ra",
      definitionString: `
      {
        "Comment": "A description of my state machine",
        "StartAt": "processPaymentFunction",
        "States": {
          "processPaymentFunction": {
            "Type": "Task",
            "Resource": "arn:aws:states:::lambda:invoke",
            "OutputPath": "$.Payload",
            "Parameters": {
              "Payload.$": "$",
              "FunctionName": "${ProcessPaymentFunction.functionArn}"
            },
            "Retry": [
              {
                "ErrorEquals": [
                  "Lambda.ServiceException",
                  "Lambda.AWSLambdaException",
                  "Lambda.SdkClientException",
                  "Lambda.TooManyRequestsException"
                ],
                "IntervalSeconds": 1,
                "MaxAttempts": 3,
                "BackoffRate": 2
              }
            ],
            "Next": "Choice"
          },
          "Choice": {
            "Type": "Choice",
            "Choices": [
              {
                "Variable": "$.payment_processed",
                "BooleanEquals": true,
                "Next": "ShipOrderFunction"
              }
            ],
            "Default": "Handle Error"
          },
          "ShipOrderFunction": {
            "Type": "Task",
            "Resource": "arn:aws:states:::lambda:invoke",
            "OutputPath": "$.Payload",
            "Parameters": {
              "Payload.$": "$",
              "FunctionName": "${ShipOrderFunction.functionArn}"
            },
            "Retry": [
              {
                "ErrorEquals": [
                  "Lambda.ServiceException",
                  "Lambda.AWSLambdaException",
                  "Lambda.SdkClientException",
                  "Lambda.TooManyRequestsException"
                ],
                "IntervalSeconds": 1,
                "MaxAttempts": 3,
                "BackoffRate": 2
              }
            ],
            "Next": "Choice (1)"
          },
          "Choice (1)": {
            "Type": "Choice",
            "Choices": [
              {
                "Variable": "$.order_shipped",
                "BooleanEquals": true,
                "Next": "Update Reward function"
              }
            ],
            "Default": "Handle Error"
          },
          "Update Reward function": {
            "Type": "Task",
            "Resource": "arn:aws:states:::lambda:invoke",
            "OutputPath": "$.Payload",
            "Parameters": {
              "Payload.$": "$",
              "FunctionName": "${UpdateRewardFunction.functionArn}"
            },
            "Retry": [
              {
                "ErrorEquals": [
                  "Lambda.ServiceException",
                  "Lambda.AWSLambdaException",
                  "Lambda.SdkClientException",
                  "Lambda.TooManyRequestsException"
                ],
                "IntervalSeconds": 1,
                "MaxAttempts": 3,
                "BackoffRate": 2
              }
            ],
            "Next": "Choice (2)"
          },
          "Choice (2)": {
            "Type": "Choice",
            "Choices": [
              {
                "Variable": "$.update_reward",
                "BooleanEquals": true,
                "Next": "Put Item"
              }
            ],
            "Default": "Handle Error"
          },
          "Put Item": {
            "Type": "Task",
            "Resource": "arn:aws:states:::dynamodb:putItem",
            "Parameters": {
              "TableName": "${DynamoDBTable.tableName}",
              "Item": {
                "product_id": {
                  "S.$": "$.product_id"
                },
                "Payment_processed": {
                  "BOOL": true
                },
                "Ship_order": {
                  "BOOL": true
                },
                "Update_reward": {
                  "BOOL": true
                }
              }
            },
            "Next": "Transform Data",
            "ResultPath": null
          },
          "Transform Data": {
            "Type": "Pass",
            "End": true,
            "Parameters": {
              "Product ID.$": "$.product_id",
              "Payment has been processed.$": "$.payment_processed",
              "Order has been shipped.$": "$.order_shipped",
              "Reward was updated.$": "$.update_reward"
            }
          },
          "Handle Error": {
            "Type": "Pass",
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
