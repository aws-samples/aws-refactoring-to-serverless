#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { OriginalReplaceEventpatternWithLambdaStack } from '../lib/original-replace-eventpattern-with-lambda-stack';
import { RefactoredReplaceEventpatternWithLambdaStack } from '../lib/refactored-replace-eventpattern-with-lambda-stack';

const app = new cdk.App();
new OriginalReplaceEventpatternWithLambdaStack(app, 'OriginalReplaceEventpatternWithLambdaStack', {});
new RefactoredReplaceEventpatternWithLambdaStack(app, 'RefactoredReplaceEventpatternWithLambdaStack', {});