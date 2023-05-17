import {
    Stack,
    StackProps,
    aws_lambda as lambda,
    aws_iam as iam
  } from 'aws-cdk-lib';
  import { Construct } from 'constructs';
  import { NagSuppressions } from 'cdk-nag'

export class OrchestrationStack extends Stack {}