#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
// import { ChoreographyToOrchestrationStack } from '../lib/choreography-stack';
import { ChoreographyStack } from '../lib/choreography-stack';
import { OrchestrationStack } from '../lib/orchestration-stack';
import { AwsSolutionsChecks } from 'cdk-nag'
import { Aspects } from 'aws-cdk-lib';


const app = new cdk.App();
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

new ChoreographyStack(app, 'ChoreographyStack');
new OrchestrationStack(app, 'OrchestrationStack');
