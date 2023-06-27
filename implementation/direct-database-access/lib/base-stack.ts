import { Construct } from 'constructs';
import { CfnOutput, RemovalPolicy, Stack, StackProps} from 'aws-cdk-lib';
import { Table, BillingMode, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { NagSuppressions } from 'cdk-nag'
import {v4 as uuid} from 'uuid';

export class BaseStack extends Stack {
  public readonly dynamoTable: Table;
  
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a DynamoDB Table
    this.dynamoTable = new Table(this, 'OrdersTable', {
      tableName: 'OrdersTable',
      partitionKey: {name:'orderId', type: AttributeType.STRING},
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    // Step Functions executes a DynamoPutItem task without Lambda
    const stateMachine = new sfn.StateMachine(this, 'StateMachineCreateOrder', {
      stateMachineName: 'StateMachineCreateOrder',
      definition: new tasks.DynamoPutItem(this, "WriteDynamoDBTask", {
        table: this.dynamoTable,
        item: {
          orderId: tasks.DynamoAttributeValue.fromString(uuid()),
          productType: tasks.DynamoAttributeValue.fromString("pizza"),
          quantity: tasks.DynamoAttributeValue.fromNumber(1),
        },
      })
    });
    
    // Outputs
    new CfnOutput(this, 'DynamoDbTableName', { value: this.dynamoTable.tableName });
    new CfnOutput(this, 'StateMachineCreateOrderArn', { value: stateMachine.stateMachineArn });
  }
}