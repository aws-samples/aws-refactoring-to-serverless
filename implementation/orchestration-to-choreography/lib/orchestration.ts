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

  const stepRole = new iam.CfnRole(this, 'stepRole', {
    path: "/service-role/",
    roleName: "StepFunctions-LoanBroker-role-31dd8566",
    assumeRolePolicyDocument: "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"states.amazonaws.com\"},\"Action\":\"sts:AssumeRole\"}]}",
    maxSessionDuration: 3600,
    managedPolicyArns: [
        "arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess",
        "arn:aws:iam::564420990987:policy/service-role/LambdaInvokeScopedAccessPolicy-99c52ddc-924b-4bda-9645-263ed929a869",
        "arn:aws:iam::564420990987:policy/service-role/XRayAccessPolicy-1ef2b9b3-079a-4bb1-a399-a352964beca1"
    ]
});

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
  const StepFunctionsStateMachine = new sfn.CfnStateMachine(this, 'StepFunctionsStateMachine', {
    stateMachineName: "LoanBroker",
    definitionString: `
{
"Comment": "A description of my state machine",
"StartAt": "Get Credit Score",
"States": {
"Get Credit Score": {
"Type": "Task",
"Resource": "arn:aws:states:::lambda:invoke",
"Parameters": {
"FunctionName": "arn:aws:lambda:ap-southeast-1:564420990987:function:GetCreditScore:$LATEST",
"Payload": {
  "SSN.$": "$.SSN",
  "RequestId.$": "$$.Execution.Id"
}
},
"Retry": [
{
  "ErrorEquals": [
    "Lambda.ServiceException",
    "Lambda.AWSLambdaException",
    "Lambda.SdkClientException",
    "Lambda.TooManyRequestsException"
  ],
  "IntervalSeconds": 2,
  "MaxAttempts": 6,
  "BackoffRate": 2
}
],
"ResultPath": "$.Credit",
"ResultSelector": {
"Score.$": "$.Payload.body.score",
"History.$": "$.Payload.body.history"
},
"Next": "Fetch Bank Addresses"
},
"Fetch Bank Addresses": {
"Type": "Task",
"Resource": "arn:aws:states:::dynamodb:getItem",
"Parameters": {
"TableName": "LoanBrokerBanks",
"Key": {
  "Type": {
    "S": "Home"
  }
}
},
"ResultSelector": {
"BankAddress.$": "$.Item.BankAddress.L[*].S"
},
"ResultPath": "$.Banks",
"Next": "Request Quotes"
},
"Request Quotes": {
"Type": "Map",
"ItemProcessor": {
"ProcessorConfig": {
  "Mode": "INLINE"
},
"StartAt": "Get Quote",
"States": {
  "Get Quote": {
    "Type": "Task",
    "Resource": "arn:aws:states:::lambda:invoke",
    "Parameters": {
      "FunctionName.$": "$.function",
      "Payload": {
        "SSN.$": "$.SSN",
        "Amount.$": "$.Amount",
        "Term.$": "$.Term",
        "Credit.$": "$.Credit"
      }
    },
    "Retry": [
      {
        "ErrorEquals": [
          "Lambda.ServiceException",
          "Lambda.AWSLambdaException",
          "Lambda.SdkClientException",
          "Lambda.TooManyRequestsException"
        ],
        "IntervalSeconds": 2,
        "MaxAttempts": 6,
        "BackoffRate": 2
      }
    ],
    "End": true,
    "ResultSelector": {
      "Quote.$": "$.Payload"
    }
  }
}
},
"End": true,
"ItemsPath": "$.Banks.BankAddress",
"ItemSelector": {
"function.$": "$$.Map.Item.Value",
"SSN.$": "$.SSN",
"Amount.$": "$.Amount",
"Term.$": "$.Term",
"Credit.$": "$.Credit"
},
"ResultPath": "$.Quotes"
}
}
}
`,
    roleArn: stepRole.attrArn,
    stateMachineType: "STANDARD",
    loggingConfiguration: {
        includeExecutionData: false,
        level: "OFF"
    }
    });
  
  }
}






 

    