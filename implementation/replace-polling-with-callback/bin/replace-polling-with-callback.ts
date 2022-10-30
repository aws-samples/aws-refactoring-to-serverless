#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PollingExample } from '../lib/replace-polling-with-callback-before';
import { CallbackExample } from '../lib/replace-polling-with-callback-refactored';

const app = new cdk.App();

// Before example polling for the result
new PollingExample(app, 'PizzaPolling', {});

// Refactored example waiting for the callback with task token
new CallbackExample(app, 'PizzaCallback', {});

