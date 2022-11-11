import { Construct } from 'constructs';
import { CfnOutput, Duration, Stack, StackProps} from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import path = require('path');

export interface ReadDynamoDBStackOriginalProps extends StackProps {
  dynamoTable: Table;
}

export class ReadDynamoDBStackOriginal extends Stack {
  constructor(scope: Construct, id: string, props: ReadDynamoDBStackOriginalProps) {
    super(scope, id, props);

    // Lambda function to read from DynamoDB
    const lambdaReadDynamoDB = new NodejsFunction(this, 'lambdaReadDynamoDB', {
      functionName: 'lambdaReadDynamoDB',
      runtime: Runtime.NODEJS_16_X,
      memorySize: 128,
      timeout: Duration.seconds(3),
      entry: path.join(__dirname, '../lambda/read-dynamodb.ts'),
      handler: 'main',
      environment: {
        DatabaseTable: props.dynamoTable.tableName
      }
    });
    
    // Step Functions invokes Lambda to get Item
    const stateMachine = new sfn.StateMachine(this, 'StateMachineOriginal', {
      definition: new tasks.LambdaInvoke(this, "ReadDynamoDBLambdaTask", {
        lambdaFunction: lambdaReadDynamoDB,
        payload: sfn.TaskInput.fromJsonPathAt('$'),
        outputPath: sfn.JsonPath.stringAt("$"),
      })
    });
    
    // Grants Lambda access to DynamoDB table 
    props.dynamoTable.grantReadData(lambdaReadDynamoDB);
    
    // Outputs
    new CfnOutput(this, 'ReadDynamoDBLambdaFunctionArn', { value: lambdaReadDynamoDB.functionArn });
    new CfnOutput(this, 'StateMachineOriginalArn', { value: stateMachine.stateMachineArn });
  }
}
