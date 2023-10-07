#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ExtractMessageRouterOriginalStack } from '../lib/extract-message-router-original';
import { ExtractMessageRouterRefactoredStack } from '../lib/extract-message-router-refactored';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag'
import { Aspects } from 'aws-cdk-lib';

const app = new cdk.App();
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

const originalStack = new ExtractMessageRouterOriginalStack(app, 'ExtractMessageRouterOriginalStack', {});
const refactoredStack = new ExtractMessageRouterRefactoredStack(app, 'ExtractMessageRouterRefactoredStack', {})

const NagSupressionList = [
    { id: 'AwsSolutions-S1', reason: 'S3 bucket is for demo purposes, not enabling server access logs' },
    { id: 'AwsSolutions-S2', reason: 'S3 bucket is for demo purposes, skipping public access restriction' },
    { id: 'AwsSolutions-S10', reason: 'S3 bucket is for demo purposes, skipping the SSL requirement' },
    { id: 'AwsSolutions-IAM4', reason: 'This is a demo application, allowing use of AWS Managed policies' }
]

NagSuppressions.addStackSuppressions(originalStack, NagSupressionList)
NagSuppressions.addStackSuppressions(refactoredStack, NagSupressionList)
