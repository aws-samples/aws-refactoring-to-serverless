#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ExtractMessageFilterOriginalStack } from '../lib/extract-message-filter-original';
import { ExtractMessageFilterRefactoredStack } from '../lib/extract-message-filter-refactored';

const app = new cdk.App();
new ExtractMessageFilterOriginalStack(app, 'ExtractMessageFilterOriginalStack', {});
new ExtractMessageFilterRefactoredStack(app, 'ExtractMessageFilterRefactoredStack', {})