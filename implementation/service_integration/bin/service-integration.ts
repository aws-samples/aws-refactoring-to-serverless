#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServiceIntegrationStackOriginal } from '../lib/service-integration-stack-original';
import {ServiceIntegrationStackRefactored} from '../lib/service-integration-stack-refactored';

const app = new cdk.App();
new ServiceIntegrationStackOriginal(app, 'ServiceIntegrationStackOriginal', {});
new ServiceIntegrationStackRefactored(app, 'ServiceIntegrationStackRefactored',{})