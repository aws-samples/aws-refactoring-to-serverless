import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { EventBus } from 'aws-cdk-lib/aws-events';
import { CfnPipe } from 'aws-cdk-lib/aws-pipes';
import { PolicyDocument, Role, ServicePrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as iam from 'aws-cdk-lib/aws-iam';


export class SendMessageViaPipesRefactoredStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // dynamodb table to store orders
    const ordersTable = new dynamodb.Table(this, 'OrdersTable', {
      tableName: 'OrdersTableRefactored',
      partitionKey: {
        name:'orderId', 
        type: dynamodb.AttributeType.STRING
      },
      // enable streams
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // event bus for dynamodb stream events
    const ordersEventBus = new EventBus(this, 'OrdersEventBus', {
			eventBusName: 'OrdersEventBusRefactored',
		});

    // Lambda functions permissions
    const processOrderLambdaRole = new iam.Role(this, 'LambdaFunctionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    processOrderLambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/ProcessOrderRefactored:*']
    }));


    // Lambda function to store orders to dynamodb table
    const processOrder = new lambda.Function(this, 'ProcessOrderLambda', {
      functionName: 'ProcessOrderRefactored',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda/process-order-refactored'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: ordersTable.tableName,
        REGION: process.env.CDK_DEFAULT_REGION!
      },
      role: processOrderLambdaRole
    });

    // allow processOrder lambda to write to dynamodb table
    ordersTable.grantWriteData(processOrder)
    
    // Permissions for the EB pipe
    const sourcePolicy = new PolicyDocument({
      statements: [
        new PolicyStatement({
          resources: [ordersTable.tableStreamArn!],
          actions: [
            'dynamodb:DescribeStream',
            'dynamodb:GetRecords',
            'dynamodb:GetShardIterator',
            'dynamodb:ListStreams'  
          ],
          effect: iam.Effect.ALLOW,
        }),
      ],
    });
    const targetPolicy = new PolicyDocument({
      statements: [
        new PolicyStatement({
          resources: [ordersEventBus.eventBusArn],
          actions: ['events:PutEvents'],
          effect: iam.Effect.ALLOW,
        }),
      ],
    });

    const pipeRole = new Role(this, 'role', {
      assumedBy: new ServicePrincipal('pipes.amazonaws.com'),
      inlinePolicies: {
        sourcePolicy,
        targetPolicy,
      },
    });

    // EB pipe (L1 construct for now)
    const pipe = new CfnPipe(this, 'pipe', {
      roleArn: pipeRole.roleArn,
      source: ordersTable.tableStreamArn!,
      sourceParameters: {
        dynamoDbStreamParameters: {
          startingPosition: 'LATEST'
        },
        // only process insert events
        filterCriteria: {
          filters: [{
            pattern: '{"eventName" : ["INSERT"] }',
          }],
        },
      },
      target: ordersEventBus.eventBusArn,
      targetParameters: {
        eventBridgeEventBusParameters: {
          detailType: 'order-details',
          source: 'my-source',
        },
        inputTemplate:
          '{ "orderId": <$.dynamodb.NewImage.orderId.S>,' +
          '  "items": <$.dynamodb.NewImage.items.L[*].S> }'
      },
    });
  }
}
