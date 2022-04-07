#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MessageFilterStack } from '../lib/message-filter-stack';


const app = new cdk.App();
new MessageFilterStack(app, 'MessageFilterStack', {});
