import {
  Stack,
  StackProps,
  aws_lambda as lambda,
  aws_iam as iam,
  aws_dynamodb as dynamodb,
  aws_stepfunctions as sfn,
  aws_stepfunctions_tasks as tasks
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag'
import { Step } from 'aws-cdk-lib/pipelines';

export class ChoreographyStack extends Stack {
constructor(scope: Construct, id: string, props?: StackProps) {
  super(scope, id, props);

  NagSuppressions.addStackSuppressions(this, [
    {
      id: 'AwsSolutions-IAM5',
      reason: 'log-group arn has :*, it cannot be avoided.'
    },
  ])
}
}