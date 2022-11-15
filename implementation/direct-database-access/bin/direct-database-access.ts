#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';

import { BaseStack } from '../lib/base-stack';
import { ReadDynamoDBStackOriginal } from '../lib/read-dynamodb-stack-original';
import { ReadDynamoDBStackRefactored } from '../lib/read-dynamodb-stack-refactored';

const app = new cdk.App();

const baseStack = new BaseStack(app, 'BaseStack');

new ReadDynamoDBStackOriginal(app, 'ReadDynamoDBStackOriginal', {
    dynamoTable: baseStack.dynamoTable
});

new ReadDynamoDBStackRefactored(app, 'ReadDynamoDBStackRefactored', {
    dynamoTable: baseStack.dynamoTable
});