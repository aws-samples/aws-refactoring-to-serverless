#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SendMessageStackOriginal } from '../lib/send-message-original';
import { SendMessageStackRefactored } from '../lib/send-message-refactored';
import { NagSuppressions, AwsSolutionsChecks } from 'cdk-nag';
import { Aspects } from 'aws-cdk-lib';
const app = new cdk.App();

Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

const sendMessageOriginalStack = new SendMessageStackOriginal(app, 'SendMessageOriginal', {});
const sendMessageRefactoredStack = new SendMessageStackRefactored(app, 'SendMessageRefactored', {});

const NagSupressionList = [
    { id: 'AwsSolutions-SQS3', reason: 'Already have a DLQ created, hence ignoring DLQ aspect' },
    { id: 'AwsSolutions-IAM5', reason: 'CloudWatch log-group arn has :*, hence wildcard cannot be avoided.' }
]

NagSuppressions.addStackSuppressions(sendMessageOriginalStack, NagSupressionList)
NagSuppressions.addStackSuppressions(sendMessageRefactoredStack, NagSupressionList)
