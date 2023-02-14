#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { BaseStack } from '../lib/base-stack';
import { ReadDynamoDBStackOriginal } from '../lib/read-dynamodb-stack-original';
import { ReadDynamoDBStackRefactored } from '../lib/read-dynamodb-stack-refactored';
import { NagSuppressions, AwsSolutionsChecks } from 'cdk-nag';


const app = new cdk.App();

cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

const baseStack = new BaseStack(app, 'BaseStack');

const readFromDynamoDBOriginalStack = new ReadDynamoDBStackOriginal(app, 'ReadDynamoDBStackOriginal', {
    dynamoTable: baseStack.dynamoTable
});

const readFromDynamoDBRefactoredStack = new ReadDynamoDBStackRefactored(app, 'ReadDynamoDBStackRefactored', {
    dynamoTable: baseStack.dynamoTable
});

const NagSupressionList = [
    { id: 'AwsSolutions-SF1', reason: 'This is demo stack, hence not enabling Cloudwatch logging from StepFunction' },
    { id: 'AwsSolutions-SF2', reason: 'This is demo stack, hence not enabling X-Ray tracing' },
    { id: 'AwsSolutions-DDB3', reason: 'This is a demo stack, hence not enabling Point-in-time Recovery for DynamoDB' },
    { id: 'AwsSolutions-IAM5', reason: 'CloudWatch log-group creates ARN with extra :*, Stepfunction lambdaInvoke is L2 construct adds IAM with *' },
]

NagSuppressions.addStackSuppressions(baseStack, NagSupressionList)
NagSuppressions.addStackSuppressions(readFromDynamoDBOriginalStack, NagSupressionList)
NagSuppressions.addStackSuppressions(readFromDynamoDBRefactoredStack, NagSupressionList)