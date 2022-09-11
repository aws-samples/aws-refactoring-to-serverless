#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SendMessageFromCodeStack } from '../lib/send-message-from-code';
import { SendMessageFromDestinationStack } from '../lib/send-message-from-destination';

const app = new cdk.App();

new SendMessageFromCodeStack(app, 'sendMessageFromCodeStack', {});  
new SendMessageFromDestinationStack(app, 'sendMessageFromDestinationStack', {});