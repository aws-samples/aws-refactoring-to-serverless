import { Construct } from 'constructs';
import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Table, BillingMode, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import path = require('path');

export class BaseStack extends Stack {
  public readonly dynamoTable: Table;
  
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    this.dynamoTable = new Table(this, 'OrdersTable', {
      tableName: 'OrdersTable',
      partitionKey: {name:'orderId', type: AttributeType.STRING},
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });
    
    // Lambda function to write to DynamoDB
    const lambdaWriteDynamoDB = new NodejsFunction(this, 'lambdaWriteDynamoDB', {
      functionName: 'lambdaWriteDynamoDB',
      runtime: Runtime.NODEJS_16_X,
      memorySize: 128,
      timeout: Duration.seconds(3),
      entry: path.join(__dirname, '../lambda/write-dynamodb.ts'),
      handler: 'main',
      environment: {
        DatabaseTable: this.dynamoTable.tableName
      }
    });
    
    // Grant permissions for Lambda
    this.dynamoTable.grantWriteData(lambdaWriteDynamoDB);
    
    // Outputs
    new CfnOutput(this, 'DynamoDbTableName', { value: this.dynamoTable.tableName });
    new CfnOutput(this, 'WriteDynamoDBLambdaFunctionArn', { value: lambdaWriteDynamoDB.functionArn });
  }
}
