import {
  Stack,
  StackProps,
  aws_lambda as lambda,
  aws_iam as iam
} from 'aws-cdk-lib';
import { LambdaDestination } from 'aws-cdk-lib/aws-lambda-destinations';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag'


export class FunctionInvocationRefactoredStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    NagSuppressions.addStackSuppressions(this, [
      {
        id: 'AwsSolutions-IAM5',
        reason: 'log-group ARN has extra :*, hence it cannot be avoided'
      },
    ])

    const destinationFnRole = new iam.Role(this, 'DestinationFnRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    destinationFnRole.addToPolicy(new iam.PolicyStatement({
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: ['arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/destinationFnRefactored:*'],
    }))

    const destinationFn = new lambda.Function(this, 'destinationFn', {
      functionName: `destinationFnRefactored`,
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda/destination'),
      handler: 'index.handler',
      role: destinationFnRole
    });

    /* AFTER Refactoring
    The invocation destination is extracted from the function code and now configured in CDK code. */
    
    const invocationFnRole = new iam.Role(this, 'InvocationFnRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    invocationFnRole.addToPolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/invocationFnRefactored:*'],
    }))

    
    const invocationFnRefactored = new lambda.Function(this, 'invocationRefactored', {
      functionName: 'invocationFnRefactored',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda/invocation-refactored'),
      handler: 'index.handler',
      onSuccess: new LambdaDestination(destinationFn, { // Uses CDK's Lambda Destination  
        responseOnly: true, // Allows to auto-extract the response payload from the invocation record
      }),
      role:invocationFnRole
    }); 

  }
}
