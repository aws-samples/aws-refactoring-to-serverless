#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SqsDestinationStack } from '../lib/sqs-destination-stack';

const app = new cdk.App();
//This stack creates 2 lambdas, one that uses destination to send message and another that does not. 
new SqsDestinationStack(app, 'SqsDestinationStack', {});  