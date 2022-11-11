#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';

import { DirectDatabaseAccessStack } from '../lib/direct-database-access-stack';
import { ReadDynamoDBStackOriginal } from '../lib/read-dynamodb-stack-original';
import { ReadDynamoDBStackRefactored } from '../lib/read-dynamodb-stack-refactored';

const app = new cdk.App();

const baseStack = new DirectDatabaseAccessStack(app, 'DirectDatabaseAccessStack');

new ReadDynamoDBStackOriginal(app, 'ReadDynamoDBStackOriginal', {
    dynamoTable: baseStack.dynamoTable
});

new ReadDynamoDBStackRefactored(app, 'ReadDynamoDBStackRefactored', {
    dynamoTable: baseStack.dynamoTable
});