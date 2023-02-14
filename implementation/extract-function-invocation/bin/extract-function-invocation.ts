#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FunctionInvocationBeforeStack } from '../lib/extract-function-invocation-original';
import { FunctionInvocationRefactoredStack } from '../lib/extract-function-invocation-refactored';

import { AwsSolutionsChecks } from 'cdk-nag';
import { Aspects } from 'aws-cdk-lib';

const app = new cdk.App();

Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

// The original example without refactoring using the invokation logic in code 
new FunctionInvocationBeforeStack(app, 'invocation-original', {
});

// The refactored example using CDK Lambda Destinations 
new FunctionInvocationRefactoredStack(app, 'invocation-refactored', {
});