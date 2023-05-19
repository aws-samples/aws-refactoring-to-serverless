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

export class OrchestrationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    NagSuppressions.addStackSuppressions(this, [
      {
        id: 'AwsSolutions-IAM5',
        reason: 'log-group arn has :*, it cannot be avoided.'
      },
    ])

    // Create the Role
    const orchestrationRole = new iam.Role(this, 'OrchestrationRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    orchestrationRole.addToPolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: [
        'arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/getCreditScore:*',
        'arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/BankRecipientPawnshop:*',
        'arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/BankRecipientPremium:*',
        'arn:aws:logs:' + this.region + ':' + this.account + ':log-group:/aws/lambda/BankRecipientUniversal:*'
      ],
  }))

  // Create the Lambda functions
  const getCreditScoreFn = new lambda.Function(this, 'getCreditScore', {
    functionName: `GetCreditScore`,
    runtime: lambda.Runtime.NODEJS_18_X,
    code: lambda.Code.fromAsset('lambda/orchestration'),
    handler: 'index.handler',
    role: orchestrationRole,
  });

  const bankRecipientPawnshopFn = new lambda.Function(this, 'BankRecipientPawnshop', {
    environment: {
        max_loan_amount: "500000",
        min_credit_score: "400",
        bank_id: "PawnShop",
        base_rate: "5"
    },
    functionName: `BankRecipientPawnshop`,
    runtime: lambda.Runtime.NODEJS_18_X,
    code: lambda.Code.fromAsset('lambda/orchestration'),
    handler: 'Recipient.handler',
    role: orchestrationRole
  });

  const bankRecipientPremiumFn = new lambda.Function(this, 'BankRecipientPremium', {
    environment: {
        max_loan_amount: "900000",
        min_credit_score: "600",
        bank_id: "Premium",
        base_rate: "3"
    },
    functionName: `BankRecipientPremium`,
    runtime: lambda.Runtime.NODEJS_18_X,
    code: lambda.Code.fromAsset('lambda/orchestration'),
    handler: 'Recipient.handler',
    role: orchestrationRole
  });

  const bankRecipientUniversalFn = new lambda.Function(this, 'BankRecipientUniversal', {
    environment: {
          max_loan_amount: "700000",
          min_credit_score: "500",
          bank_id: "Universal",
          base_rate: "4"
    },
    functionName: `BankRecipientUniversal`,
    runtime: lambda.Runtime.NODEJS_18_X,
    code: lambda.Code.fromAsset('lambda/orchestration'),
    handler: 'Recipient.handler',
    role: orchestrationRole
  });

  // Create DynamoDB table
  const bankTable = new dynamodb.Table(this, 'LoanBrokerBanks', {
    tableName: 'LoanBrokerBanks',
    partitionKey: {
      name: 'Type',
      type: dynamodb.AttributeType.STRING
    }
  });

  // Create the Step Functions state machine
  const stateMachine = new sfn.StateMachine(this, 'MyStateMachine', {
    definition: sfn.Chain.start(
      // Define your Step Functions steps here
      new tasks.LambdaInvoke(this, 'Get Credit Score', {
        lambdaFunction: getCreditScoreFn,
        payload: sfn.TaskInput.fromObject ({
          "SSN.$": "$.SSN",
          "RequestId.$": "$$.Execution.Id"
        }),
        resultPath: '"$.Credit',
        resultSelector: {
          "Score.$": "$.Payload.body.score",
          "History.$": "$.Payload.body.history"
        }
      }).next(
        new tasks.DynamoGetItem(this, 'Fetch Bank Addresses', {
          table: bankTable,
          key: {
            'Type': tasks.DynamoAttributeValue.fromString('Home')
          },
          resultSelector: {
            'BankAddress.$': '$.Item.BankAddress.L[*].S'
          },
          resultPath: '$.Banks'
        }),
      ).next(
        new sfn.Map(this, 'RequestQuotes', {
          itemsPath: sfn.JsonPath.stringAt('$.Banks.BankAddress'),
          resultPath: sfn.JsonPath.stringAt('$.Quotes'),
        }).iterator(
          new tasks.LambdaInvoke(this, 'Get Quote', {
            lambdaFunction: lambda.Function.fromFunctionName(this, '$$Map.Item.Value', sfn.JsonPath.stringAt('$.function')),
              payload: sfn.TaskInput.fromObject({
                'SSN.$': sfn.JsonPath.stringAt('$.SSN'),
                'Amount.$': sfn.JsonPath.stringAt('$.Amount'),
                'Term.$': sfn.JsonPath.stringAt('$.Term'),
                'Credit.$': sfn.JsonPath.stringAt('$.Credit'),
              }),
              resultSelector: {
                'Quote.$': sfn.JsonPath.stringAt('$.Payload'),
              },
          })
        )
      )),
    });
  }
}






 

    