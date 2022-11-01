#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FunctionInvocationStack } from '../lib/extract-function-invocation-stack';

const app = new cdk.App();
new FunctionInvocationStack(app, 'FunctionInvocationStack', {
});