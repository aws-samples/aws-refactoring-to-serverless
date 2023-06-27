import { Construct } from 'constructs';
import { CfnOutput, Stack, StackProps, aws_lambda as lambda } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as iam from 'aws-cdk-lib/aws-iam';
import path = require('path');

export interface ReadDynamoDBStackOriginalProps extends StackProps {
  dynamoTable: Table;
}

export class ReadDynamoDBStackOriginal extends Stack {
  constructor(scope: Construct, id: string, props: ReadDynamoDBStackOriginalProps) {
    super(scope, id, props);

    const lambdaReadDynamoDBRole = new iam.Role(this, 'LambdaFunctionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    lambdaReadDynamoDBRole.addToPolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/ReadDynamoDB:*']
    }));

    lambdaReadDynamoDBRole.addToPolicy(new iam.PolicyStatement({
      actions: ['dynamodb:GetItem'],
      resources: [props.dynamoTable.tableArn]
    }));


    // Lambda function to read from DynamoDB
    const lambdaReadDynamoDB = new lambda.Function(this, 'lambdaReadDynamoDB', {
      functionName: 'ReadDynamoDB',
      runtime: Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      handler: 'read-dynamodb.handler',
      environment: {
        DatabaseTable: props.dynamoTable.tableName
      },
      role: lambdaReadDynamoDBRole
    });


    // Step Functions invokes Lambda to get Item
    const stateMachine = new sfn.StateMachine(this, 'StateMachineOriginal', {
      stateMachineName: 'StateMachineOriginal',
      definition: new tasks.LambdaInvoke(this, "ReadDynamoDBLambdaTask", {
        lambdaFunction: lambdaReadDynamoDB,
        payload: sfn.TaskInput.fromJsonPathAt('$'),
        outputPath: sfn.JsonPath.stringAt("$"),
      })
    });


    // Outputs
    new CfnOutput(this, 'ReadDynamoDBLambdaFunctionArn', { value: lambdaReadDynamoDB.functionArn });
    new CfnOutput(this, 'StateMachineOriginalArn', { value: stateMachine.stateMachineArn });
  }
}
