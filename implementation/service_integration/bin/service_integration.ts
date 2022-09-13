#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServiceIntegrationStack } from '../lib/service_integration-stack';

const app = new cdk.App();
new ServiceIntegrationStack(app, 'ServiceIntegrationStack', {});