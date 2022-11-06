import {
  Stack,
  StackProps,
  aws_lambda as lambda
} from 'aws-cdk-lib';
import { LambdaDestination } from 'aws-cdk-lib/aws-lambda-destinations';
import { Construct } from 'constructs';

export class FunctionInvocationRefactoredStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /* Async Function invocation in code vs. using Lambda Destinations */

    /* COMMON:
     Destination Lambda Fuction logs the received event */
    const destinationFn = new lambda.Function(this, 'destinationFn', {
      functionName: `destinationFnRefactored`,
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda/destination'),
      handler: 'index.handler',
    });

    /* AFTER:
    Invocation Lambda Fuction after refactoring.
    The invokation destination is extracted from the function code and now configured in CDK code. */
    new lambda.Function(this, 'invocationRefactored', {
      functionName: 'invocationFnRefactored',
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda/invocation-refactored'),
      handler: 'index.handler',
      onSuccess: new LambdaDestination(destinationFn, { // Uses CDK's Lambda Destination  
        responseOnly: true,
      }),
    }); 

  }
}
