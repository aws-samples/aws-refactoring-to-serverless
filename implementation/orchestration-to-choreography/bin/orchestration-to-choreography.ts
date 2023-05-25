#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { OrchestrationStack } from '../lib/orchestration';
import { ChoreographyStack } from '../lib/choreography';
import { NagSuppressions, AwsSolutionsChecks } from 'cdk-nag';
import { Aspects } from 'aws-cdk-lib';


const app = new cdk.App();

Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

const orchestrationStack = new OrchestrationStack(app, 'OrchestrationStack', {
});

const choreographyStack = new ChoreographyStack(app, 'ChoreographyStack', {
});

const NagSupressionList = [
    { id: 'AwsSolutions-SF1', reason: 'This is demo stack, hence not enabling Cloudwatch logging from StepFunction' },
    { id: 'AwsSolutions-SF2', reason: 'This is demo stack, hence not enabling X-Ray tracing' },
    { id: 'AwsSolutions-DDB3', reason: 'This is a demo stack, hence not enabling Point-in-time Recovery for DynamoDB' },
    { id: 'AwsSolutions-IAM5', reason: 'CloudWatch log-group creates ARN with extra :*, Stepfunction lambdaInvoke is L2 construct adds IAM with *' },
]

NagSuppressions.addStackSuppressions(orchestrationStack, NagSupressionList)
NagSuppressions.addStackSuppressions(choreographyStack, NagSupressionList)