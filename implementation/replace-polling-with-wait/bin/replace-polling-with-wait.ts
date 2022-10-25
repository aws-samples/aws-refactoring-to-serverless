#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ReplacePollingWithWaitStack } from '../lib/replace-polling-with-wait-stack';

const app = new cdk.App();
new ReplacePollingWithWaitStack(app, 'ReplacePollingWithWaitStack', {
});