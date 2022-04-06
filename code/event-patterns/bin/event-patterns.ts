#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EventPatternsStack } from '../lib/event-patterns-stack';

const app = new cdk.App();
new EventPatternsStack(app, 'EventPatternsStack', {});