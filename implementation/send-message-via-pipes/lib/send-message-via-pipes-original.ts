import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';

export class SendMessageViaPipesOriginalStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // dynamodb table to store orders
    const ordersTable = new dynamodb.Table(this, 'OrdersTable', {
      tableName: 'OrdersTableOriginal',
      partitionKey: {
        name:'orderId', 
        type: dynamodb.AttributeType.STRING
      },
      removalPolicy: RemovalPolicy.DESTROY
    });

    // event bus for dynamodb stream events
    const ordersEventBus = new EventBus(this, 'OrdersEventBus', {
			eventBusName: 'OrdersEventBusOriginal',
		});
    
    // Lambda function permissions
    const processOrderLambdaRole = new iam.Role(this, 'LambdaFunctionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    processOrderLambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/ProcessOrderOriginal:*']
    }));

    // Lambda function to store orders to dynamodb table and send events to EB
    const processOrder = new lambda.Function(this, 'ProcessOrderLambda', {
      functionName: 'ProcessOrderOriginal',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda/process-order-original'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: ordersTable.tableName,
        EVENT_BUS_NAME: ordersEventBus.eventBusName,
        REGION: process.env.CDK_DEFAULT_REGION!
      },
      role: processOrderLambdaRole
    });

    // allow processOrder lambda to write to dynamodb table
    ordersTable.grantWriteData(processOrder)
    
    // allow processOrder lambda to send events to event bus
    ordersEventBus.grantPutEventsTo(processOrder)
  }
}
