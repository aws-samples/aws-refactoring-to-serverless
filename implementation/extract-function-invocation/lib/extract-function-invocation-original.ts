import {
  Stack,
  StackProps,
  aws_lambda as lambda
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class FunctionInvocationBeforeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /* Async Function invocation in code */

    /* COMMON:
     Destination Lambda Fuction logs the received event */
    const destinationFn = new lambda.Function(this, 'destinationFn', {
      functionName: `destinationFnOriginal`,
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda/destination'),
      handler: 'index.handler',
    });

    /* BEFORE REFACTORING: 
    Invocation Lambda Fuction before refactoring.
    This function invokes the destination as part of the code. */
    const beforeRefactoringFn = new lambda.Function(this, 'invocationBeforeFn', {
      functionName: 'invocationFnOriginal',
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda/invocation-before'),
      handler: 'index.handler',
      environment: { FUNCTION_NAME: destinationFn.functionName },
    });
    destinationFn.grantInvoke(beforeRefactoringFn);

  }
}
