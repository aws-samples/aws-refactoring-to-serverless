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
          attributeName: "from",
          attributeType: "S",
        },
        {
          attributeName: "stock_id",
          attributeType: "S",
        },
      ],
      tableName: "StockRecommendationTable",
      keySchema: [
        {
          attributeName: "stock_id",
          keyType: "HASH",
        },
        {
          attributeName: "from",
          keyType: "RANGE",
        },
      ],
      provisionedThroughput: {
        readCapacityUnits: 1,
        writeCapacityUnits: 1,
      },
    });

    const pointInTimeRecoverySpecificationProperty: dynamodb.CfnGlobalTable.PointInTimeRecoverySpecificationProperty = {
      pointInTimeRecoveryEnabled: true,
    };

    const aggregatorRole = new iam.Role(this, "Aggregator Role", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    aggregatorRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["dynamodb:PutItem"],
        resources: [DynamoDBTable.attrArn],
      })
    );

    aggregatorRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    const AggregatorFunction = new lambda.Function(this, "AggregatorFunction", {
      description: "",
      environment: {
        table_name: DynamoDBTable.ref,
      },
      functionName: "StockRecommendationAggregator",
      handler: "Aggregator.lambda_handler",
      code: lambda.Code.fromAsset("lambda"),
      memorySize: 128,
      role: aggregatorRole,
      runtime: lambda.Runtime.PYTHON_3_9,
    });

    const SQSQueue = new sqs.Queue(this, "SQSQueue", {
      queueName: "StockRecommendationQueue",
    });




    AggregatorFunction.addEventSource(
      new sources.SqsEventSource(SQSQueue, { batchSize: 10 })
    );

    const resourceRole1 = new iam.Role(this, "Resource Role1", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    resourceRole1.addToPolicy(
      new iam.PolicyStatement({
        actions: ["sqs:SendMessage"],
        resources: [SQSQueue.queueArn],
      })
    );

    resourceRole1.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );


    const ResourceFunction1 = new lambda.Function(this, "ResourceFunction1", {
      description: "",
      environment: {
        queue_url: SQSQueue.queueUrl,
      },
      functionName: "RecommendationResource1",
      handler: "Resource.lambda_handler",
      code: lambda.Code.fromAsset("lambda"),
      memorySize: 128,
      role: resourceRole1,
      runtime: lambda.Runtime.PYTHON_3_9,
    });

    const resourceRole2 = new iam.Role(this, "Resource Role2", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    resourceRole2.addToPolicy(
      new iam.PolicyStatement({
        actions: ["sqs:SendMessage"],
        resources: [SQSQueue.queueArn],
      })
    );

    resourceRole2.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    const ResourceFunction2 = new lambda.Function(this, "ResourceFunction2", {
      description: "",
      environment: {
        queue_url: SQSQueue.queueUrl,
      },
      functionName: "RecommendationResource2",
      handler: "Resource.lambda_handler",
      code: lambda.Code.fromAsset("lambda"),
      memorySize: 128,
      role: resourceRole2,
      runtime: lambda.Runtime.PYTHON_3_9,
    });

    const resourceRole3 = new iam.Role(this, "Resource Role3", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    resourceRole3.addToPolicy(
      new iam.PolicyStatement({
        actions: ["sqs:SendMessage"],
        resources: [SQSQueue.queueArn],
      })
    );

    resourceRole3.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    const ResourceFunction3 = new lambda.Function(this, "ResourceFunction3", {
      description: "",
      environment: {
        queue_url: SQSQueue.queueUrl,
      },
      functionName: "RecommendationResource3",
      handler: "Resource.lambda_handler",
      code: lambda.Code.fromAsset("lambda"),
      memorySize: 128,
      role: resourceRole3,
      runtime: lambda.Runtime.PYTHON_3_9,
    });

    const SNSTopic = new sns.CfnTopic(this, "SNSTopic", {
      displayName: "StockRecommendation",
      topicName: "StockRecommendation",
      kmsMasterKeyId: "alias/aws/sns",
    });

    const SNSTopicPolicy = new sns.CfnTopicPolicy(this, "SNSTopicPolicy", {
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
            Resource: `${SNSTopic.ref}`,
            Condition: {
              StringEquals: { "AWS:SourceOwner": `${this.account}` },
            },
          },
        ],
      },
      topics: [SNSTopic.ref],
    });

    const SNSSubscription1 = new sns.CfnSubscription(this, "SNSSubscription1", {
      topicArn: SNSTopic.ref,
      endpoint: ResourceFunction1.functionArn,
      protocol: "lambda",
      region: `${this.region}`,
    });

    const SNSSubscription2 = new sns.CfnSubscription(this, "SNSSubscription2", {
      topicArn: SNSTopic.ref,
      endpoint: ResourceFunction2.functionArn,
      protocol: "lambda",
      region: `${this.region}`,
    });

    const SNSSubscription3 = new sns.CfnSubscription(this, "SNSSubscription3", {
      topicArn: SNSTopic.ref,
      endpoint: ResourceFunction3.functionArn,
      protocol: "lambda",
      region: `${this.region}`,
    });

    const principal = new iam.ServicePrincipal("sns.amazonaws.com");

    ResourceFunction1.grantInvoke(principal);
    ResourceFunction2.grantInvoke(principal);
    ResourceFunction3.grantInvoke(principal);

    const prdLogGroup = new logs.LogGroup(this, "PrdLogs");

    const ApiGatewayRestApi = new apigateway.CfnRestApi(
      this,
      "ApiGatewayRestApi",
      {
        name: "StockRecommendationEndpoint",
        apiKeySourceType: "HEADER",
        endpointConfiguration: {
          types: ["REGIONAL"],
        },
      }
    );

    const ApiGatewayResource = new apigateway.CfnResource(
      this,
      "ApiGatewayResource",
      {
        restApiId: ApiGatewayRestApi.ref,
        pathPart: "query",
        parentId: ApiGatewayRestApi.attrRootResourceId,
      }
    );

    const ApiGatewayResource2 = new apigateway.CfnResource(
      this,
      "ApiGatewayResource2",
      {
        restApiId: ApiGatewayRestApi.ref,
        pathPart: "submit",
        parentId: ApiGatewayRestApi.attrRootResourceId,
      }
    );

    const ApiGatewayResource3 = new apigateway.CfnResource(
      this,
      "ApiGatewayResource3",
      {
        restApiId: ApiGatewayRestApi.ref,
        pathPart: "{id}",
        parentId: ApiGatewayResource.ref,
      }
    );

    const apiMethodRole = new iam.Role(this, "Api Method Role", {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
    });

    apiMethodRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["sns:Publish"],
        resources: [SNSTopic.ref],
      })
    );

    const ApiGatewayMethod = new apigateway.CfnMethod(
      this,
      "ApiGatewayMethod",
      {
        restApiId: ApiGatewayRestApi.ref,
        resourceId: ApiGatewayResource2.ref,
        httpMethod: "POST",
        authorizationType: "NONE",
        apiKeyRequired: false,
        requestParameters: {
          "method.request.querystring.message": true,
          "method.request.querystring.topic": true,
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
          cacheNamespace: ApiGatewayResource2.ref,
          credentials: apiMethodRole.roleArn,
          integrationHttpMethod: "POST",
          integrationResponses: [
            {
              responseTemplates: {},
              statusCode: "200",
            },
          ],
          passthroughBehavior: "WHEN_NO_MATCH",
          requestParameters: {
            "integration.request.querystring.Message":
              "method.request.querystring.message",
            "integration.request.querystring.TopicArn":
              "method.request.querystring.topic",
          },
          timeoutInMillis: 29000,
          type: "AWS",
          uri: "arn:aws:apigateway:us-east-1:sns:action/Publish",
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
                "application/json": `{"Quotes": [
#set( $items= $input.path("$.Items") )
#foreach( $item in $items )
"Stock Id" : $item.stock_id.S,
"Recommendation" : $item.quote.S,
"Quote by" : $item.from.S
#if( $foreach.hasNext ),#end
$esc.newline
#end]}`,
              },
              statusCode: "200",
            },
          ],
          passthroughBehavior: "WHEN_NO_TEMPLATES",
          requestTemplates: {
            "application/json": `
{
"TableName": "StockRecommendationTable",
"KeyConditionExpression": "stock_id=:v1",
"ExpressionAttributeValues": {
":v1": {
  "S": "$util.urlDecode($input.params('id'))"
}
}
}`,
          },
          timeoutInMillis: 29000,
          type: "AWS",
          uri: "arn:aws:apigateway:us-east-1:dynamodb:action/Query",
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

    new CfnOutput(this, 'SNS Topic ARN: ', { value: SNSTopic.ref });
    new CfnOutput(this, 'REST API endpoint: ', { value: `https://${ApiGatewayDeployment.restApiId}.execute-api.${this.region}.amazonaws.com/prod` });
  }
}
