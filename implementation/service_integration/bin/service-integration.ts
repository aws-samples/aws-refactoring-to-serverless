#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServiceIntegrationStackOriginal } from '../lib/service-integration-stack-original';
import {ServiceIntegrationStackRefactored} from '../lib/service-integration-stack-refactored';
import { NagSuppressions, AwsSolutionsChecks } from 'cdk-nag';

const app = new cdk.App();

cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

const imageProcessingOriginal = new ServiceIntegrationStackOriginal(app, 'ServiceIntegrationStackOriginal', {});
const imageProcessingRefactored = new ServiceIntegrationStackRefactored(app, 'ServiceIntegrationStackRefactored',{})

const NagSupressionList = [
    { id: 'AwsSolutions-SF1', reason: 'This is demo stack, hence ignoring Cloudwatch logging for StepFunction' },
    { id: 'AwsSolutions-SF2', reason: 'This is demo stack, hence ignoring X-Ray tracing' },
    { id: 'AwsSolutions-S1', reason: 'This is demo stack, no need to enable server access logs' },
    { id: 'AwsSolutions-IAM5', reason: 'Reviewed IAM permissons manually to make sure the wild card permissions are on narrowed resource' }
]

NagSuppressions.addStackSuppressions(imageProcessingOriginal, NagSupressionList)
NagSuppressions.addStackSuppressions(imageProcessingRefactored, NagSupressionList)
