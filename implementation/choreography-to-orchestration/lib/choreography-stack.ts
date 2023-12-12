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
  aws_logs as logs,
  CfnOutput,
} from "aws-cdk-lib";
import { NagSuppressions } from 'cdk-nag'
import { SqsQueue } from "aws-cdk-lib/aws-events-targets";

export class ChoreographyStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    NagSuppressions.addStackSuppressions(this, [
      {
        id: 'AwsSolutions-IAM5',
        reason: 'log-group arn has :*, it cannot be avoided.'
      },
      {
        id: 'AwsSolutions-SQS3',
        reason: 'we do not configure a DLQ for simplicity'
      },
      {
        id: 'AwsSolutions-SQS4',
        reason: 'we do not do encryption of SQS for simplicity'
      },
      {
        id: 'AwsSolutions-APIG2',
        reason: 'We do not add authorization for simplicity'
      },
      {
        id: 'AwsSolutions-APIG4',
        reason: 'We do not add authorization to methods for simplicity'
      },
      {
        id: 'AwsSolutions-COG4',
        reason: 'We do not add cognito user pool authorizer for simplicity'
      },
      {
        id: 'AwsSolutions-APIG1',
        reason: 'This is demo stack, hence ignoring access logging for API stage'
      },
      {
        id: 'AwsSolutions-APIG6',
        reason: 'This is demo stack, hence ignoring CW logging for API methods'
      },
      {
        id: 'AwsSolutions-IAM4',
        reason: 'This is a demo application, allowing use of AWS Managed policies'
      }
    ]);

    const DynamoDBTable = new dynamodb.CfnTable(this, "DynamoDBTable", {
      attributeDefinitions: [
        {
          attributeName: "product_id",
          attributeType: "S",
        }
      ],
      tableName: "temporary-data-store",
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

    const pointInTimeRecoverySpecificationProperty: dynamodb.CfnGlobalTable.PointInTimeRecoverySpecificationProperty = {
      pointInTimeRecoveryEnabled: true,
    };

    const ProcessPaymentFunctionRole = new iam.Role(this, "Process Payment Function Role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    ProcessPaymentFunctionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:PutItem"],
        resources: [DynamoDBTable.attrArn],
      })
    );

    ProcessPaymentFunctionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    const SNSTopic_ShipOrder = new sns.CfnTopic(this, "SNSTopic_ShipOrder", {
        displayName: "ShipOrderTopic",
        topicName: "ShipOrderTopic",
        kmsMasterKeyId: "alias/aws/sns",
      });

    const ProcessPaymentFunction = new lambda.Function(this, "ProcessPaymentFunction", {
      description: "",
      environment: {
        table_name: DynamoDBTable.ref,
        sns_topic_arn : SNSTopic_ShipOrder.ref
      },
      functionName: "ProcessPaymentFunction",
      handler: "ProcessPayment.lambda_handler",
      code: lambda.Code.fromAsset("lambda/choreography"),
      memorySize: 128,
      role: ProcessPaymentFunctionRole,
      runtime: lambda.Runtime.PYTHON_3_10,
    });

    const api_principal = new iam.ServicePrincipal("apigateway.amazonaws.com");

    ProcessPaymentFunction.grantInvoke(api_principal);

    const SNSTopicPolicy_ShipOrder = new sns.CfnTopicPolicy(this, "SNSTopicPolicy_ShipOrder", {
        policyDocument: {
          Version: "2008-10-17",
          Id: "__default_policy_ID",
          Statement: [
            {
              Sid: "__default_statement_ID",
              Effect: "Allow",
              Principal: { AWS: "*" },
              Action: [
                "SNS:GetTopicAttributes",
                "SNS:SetTopicAttributes",
                "SNS:AddPermission",
                "SNS:RemovePermission",
                "SNS:DeleteTopic",
                "SNS:Subscribe",
                "SNS:ListSubscriptionsByTopic",
                "SNS:Publish",
              ],
              Resource: `${SNSTopic_ShipOrder.ref}`,
              Condition: {
                StringEquals: { "AWS:SourceOwner": `${this.account}` },
              },
            },
          ],
        },
        topics: [SNSTopic_ShipOrder.ref],
      });

    ProcessPaymentFunctionRole.addToPolicy(
        new iam.PolicyStatement({
          actions: ["sns:Publish"],
          resources: [SNSTopic_ShipOrder.ref],
        })
      );



    const ShipOrderFunctionRole = new iam.Role(this, "Ship Order Function Role", {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      });
  
    ShipOrderFunctionRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            "dynamodb:PutItem",
            "dynamodb:GetItem",
            "dynamodb:BatchGetItem",
            "dynamodb:Scan",
            "dynamodb:Query",
            "dynamodb:ConditionCheckItem",
            "dynamodb:UpdateItem"
        ],
          resources: [DynamoDBTable.attrArn],
        })
      );
  
      ShipOrderFunctionRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        )
      );

      const SNSTopic_UpdateReward = new sns.CfnTopic(this, "SNSTopic_UpdateReward", {
        displayName: "UpdateRewardTopic",
        topicName: "UpdateRewardTopic",
        kmsMasterKeyId: "alias/aws/sns",
      });
    

    const ShipOrderFunction = new lambda.Function(this, "ShipOrderFunction", {
        description: "",
        environment: {
          table_name: DynamoDBTable.ref,
          sns_topic_arn : SNSTopic_UpdateReward.ref
        },
        functionName: "ShipOrderFunction",
        handler: "ShipOrder.lambda_handler",
        code: lambda.Code.fromAsset("lambda/choreography"),
        memorySize: 128,
        role: ShipOrderFunctionRole,
        runtime: lambda.Runtime.PYTHON_3_10,
      });

    const SNSSubscription_ShipOrder= new sns.CfnSubscription(this, "SNSSubscription_ShipOrder", {
      topicArn: SNSTopic_ShipOrder.ref,
      endpoint: ShipOrderFunction.functionArn,
      protocol: "lambda",
      region: `${this.region}`,
    });

    const SNSTopicPolicy_UpdateReward = new sns.CfnTopicPolicy(this, "SNSTopicPolicy_UpdateReward", {
        policyDocument: {
          Version: "2008-10-17",
          Id: "__default_policy_ID",
          Statement: [
            {
              Sid: "__default_statement_ID",
              Effect: "Allow",
              Principal: { AWS: "*" },
              Action: [
                "SNS:GetTopicAttributes",
                "SNS:SetTopicAttributes",
                "SNS:AddPermission",
                "SNS:RemovePermission",
                "SNS:DeleteTopic",
                "SNS:Subscribe",
                "SNS:ListSubscriptionsByTopic",
                "SNS:Publish",
              ],
              Resource: `${SNSTopic_UpdateReward.ref}`,
              Condition: {
                StringEquals: { "AWS:SourceOwner": `${this.account}` },
              },
            },
          ],
        },
        topics: [SNSTopic_UpdateReward.ref],
      });

    ShipOrderFunctionRole.addToPolicy(
        new iam.PolicyStatement({
          actions: ["sns:Publish"],
          resources: [SNSTopic_UpdateReward.ref],
        })
      );

      const sns_principal = new iam.ServicePrincipal("sns.amazonaws.com");

      ShipOrderFunction.grantInvoke(sns_principal);

      const UpdateRewardFunctionRole = new iam.Role(this, "Update Reward Function Role", {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      });

      UpdateRewardFunctionRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            "dynamodb:PutItem",
            "dynamodb:GetItem",
            "dynamodb:BatchGetItem",
            "dynamodb:Scan",
            "dynamodb:Query",
            "dynamodb:ConditionCheckItem",
            "dynamodb:UpdateItem"
        ],
          resources: [DynamoDBTable.attrArn],
        })
      );
  
      UpdateRewardFunctionRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        )
      );

    const UpdateRewardFunction = new lambda.Function(this, "UpdateRewardFunction", {
        description: "",
        environment: {
          table_name: DynamoDBTable.ref,
        },
        functionName: "UpdateRewardFunction",
        handler: "UpdateReward.lambda_handler",
        code: lambda.Code.fromAsset("lambda/choreography"),
        memorySize: 128,
        role: UpdateRewardFunctionRole,
        runtime: lambda.Runtime.PYTHON_3_10,
      });

    const SNSSubscription_UpdateReward= new sns.CfnSubscription(this, "SNSSubscription_UpdateReward", {
        topicArn: SNSTopic_UpdateReward.ref,
        endpoint: UpdateRewardFunction.functionArn,
        protocol: "lambda",
        region: `${this.region}`,
      });
      
      UpdateRewardFunction.grantInvoke(sns_principal);

    const ApiGatewayRestApi = new apigateway.CfnRestApi(
      this,
      "ApiGatewayRestApi",
      {
        name: "OrderProductEndpoint",
        apiKeySourceType: "HEADER",
        endpointConfiguration: {
          types: ["REGIONAL"],
        },
      }
    );

    const ApiGatewayResource1 = new apigateway.CfnResource(
      this,
      "ApiGatewayResource",
      {
        restApiId: ApiGatewayRestApi.ref,
        pathPart: "getOrder",
        parentId: ApiGatewayRestApi.attrRootResourceId,
      }
    );

    const ApiGatewayResource2 = new apigateway.CfnResource(
      this,
      "ApiGatewayResource2",
      {
        restApiId: ApiGatewayRestApi.ref,
        pathPart: "placeOrder",
        parentId: ApiGatewayRestApi.attrRootResourceId,
      }
    );

    const ApiGatewayResource3 = new apigateway.CfnResource(
      this,
      "ApiGatewayResource3",
      {
        restApiId: ApiGatewayRestApi.ref,
        pathPart: "{id}",
        parentId: ApiGatewayResource1.ref,
      }
    );

    const apiMethodRole = new iam.Role(this, "Api Method Role", {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
    });

    // apiMethodRole.addToPolicy(
    //   new iam.PolicyStatement({
    //     actions: ["sns:Publish"],
    //     resources: [SNSTopic.ref],
    //   })
    // );

    const ApiGatewayMethod = new apigateway.CfnMethod(
      this,
      "ApiGatewayMethod",
      {
        restApiId: ApiGatewayRestApi.ref,
        resourceId: ApiGatewayResource2.ref,
        httpMethod: "POST",
        authorizationType: "NONE",
        apiKeyRequired: false,
        methodResponses: [
          {
            responseModels: {
              "application/json": "Empty",
            },
            statusCode: "200",
          },
        ],
        integration: {
          cacheNamespace: ApiGatewayResource2.ref,
        //   credentials: apiMethodRole.roleArn,
          integrationHttpMethod: "POST",
          integrationResponses: [
            {
              responseTemplates: {},
              statusCode: "200",
            },
          ],
          passthroughBehavior: "WHEN_NO_MATCH",
          timeoutInMillis: 29000,
          type: "AWS_PROXY",
          uri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${ProcessPaymentFunction.functionArn}/invocations` 
        },
      }
    );

    const apiMethodRole2 = new iam.Role(this, "Api Method Role 2", {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
    });

    apiMethodRole2.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "dynamodb:BatchGetItem",
          "dynamodb:Describe*",
          "dynamodb:List*",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
        ],
        resources: [DynamoDBTable.attrArn],
      })
    );

    const ApiGatewayMethod2 = new apigateway.CfnMethod(
      this,
      "ApiGatewayMethod2",
      {
        restApiId: ApiGatewayRestApi.ref,
        resourceId: ApiGatewayResource3.ref,
        httpMethod: "GET",
        authorizationType: "NONE",
        apiKeyRequired: false,
        requestParameters: {
          "method.request.path.id": true,
        },
        methodResponses: [
          {
            responseModels: {
              "application/json": "Empty",
            },
            statusCode: "200",
          },
        ],
        integration: {
          cacheNamespace: ApiGatewayResource3.ref,
          credentials: apiMethodRole2.roleArn,
          integrationHttpMethod: "POST",
          integrationResponses: [
            {
              responseTemplates: {
                "application/json": `{
                    #set( $items= $input.path("$.Items") )
                    #foreach( $item in $items )
                        "Product Id" : $item.product_id.S,
                        "Payment has been processed" : $item.Payment_processed.BOOL,
                        "Order has been shipped" : $item.Ship_order.BOOL,
                        "Reward was updated" : $item.Update_reward.BOOL
                        #if( $foreach.hasNext ),#end
                        $esc.newline
                    #end
                    }
                    `,
              },
              statusCode: "200",
            },
          ],
          passthroughBehavior: "WHEN_NO_TEMPLATES",
          requestTemplates: {
            "application/json": `{
                "TableName": "temporary-data-store",
                "KeyConditionExpression": "product_id=:v1",
                "ExpressionAttributeValues": {
                    ":v1": {
                        "S": "$util.urlDecode($input.params('id'))"
                    }
                }
            }`,
          },
          timeoutInMillis: 29000,
          type: "AWS",
          uri: `arn:aws:apigateway:${this.region}:dynamodb:action/Query`,
        },
      }
    );

    const ApiGatewayDeployment = new apigateway.CfnDeployment(
      this,
      "ApiGatewayDeployment",
      {
        restApiId: ApiGatewayRestApi.ref,
      }
    );

    ApiGatewayDeployment.node.addDependency(
      ApiGatewayMethod2,
      ApiGatewayMethod
    );

    const ApiGatewayStage = new apigateway.CfnStage(this, "ApiGatewayStage", {
      stageName: "prod",
      deploymentId: ApiGatewayDeployment.ref,
      restApiId: ApiGatewayRestApi.ref,
      cacheClusterEnabled: false,
      methodSettings: [
        {
          cacheDataEncrypted: false,
          cacheTtlInSeconds: 300,
          cachingEnabled: false,
          dataTraceEnabled: true,
          httpMethod: "*",
          metricsEnabled: false,
          resourcePath: "/*",
          throttlingBurstLimit: 5000,
          throttlingRateLimit: 10000,
        },
      ],
      tracingEnabled: false,
    });

    // new CfnOutput(this, 'SNS Topic ARN: ', { value: SNSTopic.ref });
    new CfnOutput(this, 'REST API endpoint: ', { value: `https://${ApiGatewayDeployment.restApiId}.execute-api.${this.region}.amazonaws.com` });
  }
}
