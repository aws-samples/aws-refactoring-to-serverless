#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ExtractMessageFilterOriginalStack } from '../lib/extract-message-filter-original';
import { ExtractMessageFilterRefactoredStack } from '../lib/extract-message-filter-refactored';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag'
import { Aspects } from 'aws-cdk-lib';

const app = new cdk.App();
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

const originalStack = new ExtractMessageFilterOriginalStack(app, 'ExtractMessageFilterOriginalStack', {});
const refactoredStack = new ExtractMessageFilterRefactoredStack(app, 'ExtractMessageFilterRefactoredStack', {})

const NagSupressionList = [
    { id: 'AwsSolutions-S1', reason: 'S3 bucket is for demo purposes, not enabling server access logs' },
    { id: 'AwsSolutions-S2', reason: 'S3 bucket is for demo purposes, skipping public access restriction' },
    { id: 'AwsSolutions-S10', reason: 'S3 bucket is for demo purposes, skipping SSL requirement' },
    { id: 'AwsSolutions-IAM4', reason: 'This is a demo application, allowing use of AWS Managed policies' },
    { id: 'AwsSolutions-IAM5', reason: 'This is a demo application, allowing wildcards in auto-generated IAM policies' },
]

NagSuppressions.addStackSuppressions(originalStack, NagSupressionList)
NagSuppressions.addStackSuppressions(refactoredStack, NagSupressionList)
