#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SendMessageStackOriginal } from '../lib/send-message-original';
import { SendMessageStackRefactored } from '../lib/send-message-refactored';

const app = new cdk.App();

new SendMessageStackOriginal(app, 'SendMessageOriginal', {});  
new SendMessageStackRefactored(app, 'SendMessageRefactored', {});