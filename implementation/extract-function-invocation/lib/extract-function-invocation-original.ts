import {
  Stack,
  StackProps,
  aws_lambda as lambda,
  aws_iam as iam
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag'


export class FunctionInvocationBeforeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    NagSuppressions.addStackSuppressions(this, [
      {
        id: 'AwsSolutions-IAM5',
        reason: 'log-group arn has :*, it cannot be avoided.'
      },
    ])

    const destinationFnRole = new iam.Role(this, 'DestinationFnRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    destinationFnRole.addToPolicy(new iam.PolicyStatement({
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: ['arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/destinationFnOriginal:*'],
    }))

    const destinationFn = new lambda.Function(this, 'destinationFn', {
      functionName: `destinationFnOriginal`,
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda/destination'),
      handler: 'index.handler',
      role: destinationFnRole
    });


    const invocationFnRole = new iam.Role(this, 'BeforeRefactoringFnRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    invocationFnRole.addToPolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/invocationFnOriginal:*'],
    }))

    invocationFnRole.addToPolicy(new iam.PolicyStatement({
        actions: ['lambda:InvokeFunction'],
        resources: [destinationFn.functionArn],
    }))


    /* BEFORE REFACTORING: 
    This function invokes another lambda as part of the code. */
    const invocationFnOriginal = new lambda.Function(this, 'invocationBeforeFn', {
      functionName: 'invocationFnOriginal',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda/invocation-before'),
      handler: 'index.handler',
      environment: { FUNCTION_NAME: destinationFn.functionName },
      role: invocationFnRole
    });
  }
}
