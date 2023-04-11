#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag'
import { Aspects } from 'aws-cdk-lib';

import { SendMessageViaPipesOriginalStack } from '../lib/send-message-via-pipes-original';
import { SendMessageViaPipesRefactoredStack } from '../lib/send-message-via-pipes-refactored';
const app = new cdk.App();
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

const sendMessageViaPipesOriginal = new SendMessageViaPipesOriginalStack(app, 'SendMessageViaPipesOriginalStack', {});
const sendMessageViaPipesRefactored = new SendMessageViaPipesRefactoredStack(app, 'SendMessageViaPipesRefactoredStack', {});

const NagSupressionList = [
    { id: 'AwsSolutions-DDB3', reason: 'Skipping Point-in-time Recovery for DynamoDB table for the demo application' },
    { id: 'AwsSolutions-IAM5', reason: 'The IAM role for the lambda is properly scoped to only have access to [LambdaName:*] log group'}
]

NagSuppressions.addStackSuppressions(sendMessageViaPipesOriginal, NagSupressionList)
NagSuppressions.addStackSuppressions(sendMessageViaPipesRefactored, NagSupressionList)
