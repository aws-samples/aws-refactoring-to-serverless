import { Construct } from 'constructs';
import { CfnOutput, Stack, StackProps} from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';

export interface ReadDynamoDBStackRefactoredProps extends StackProps {
  dynamoTable: Table;
}

export class ReadDynamoDBStackRefactored extends Stack {
  constructor(scope: Construct, id: string, props: ReadDynamoDBStackRefactoredProps) {
    super(scope, id, props);
    
    // Step Functions executes DynamoGetItem task without Lambda
    const stateMachine = new sfn.StateMachine(this, 'StateMachineRefactored', {
      stateMachineName: 'StateMachineRefactored',
      definition: new tasks.DynamoGetItem(this, "ReadDynamoDBTask", {
        table: props.dynamoTable,
        key: { "orderId": tasks.DynamoAttributeValue.fromString(sfn.JsonPath.stringAt('$.orderId')) },
        outputPath: sfn.JsonPath.stringAt("$"),
      })
    });
    
    // Outputs
    new CfnOutput(this, 'StateMachineRefactoredArn', { value: stateMachine.stateMachineArn });
  }
}
