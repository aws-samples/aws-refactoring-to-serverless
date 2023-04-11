from aws_cdk import (
    Stack,
    CfnOutput
)
from constructs import Construct
from scatter_gather.stepfunction.infrastructure import SFNWorkflow
from scatter_gather.lambda_.infrastructure import LambdaStates


class OriginalScatterGatherStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        lambdas = LambdaStates(self, "lambda-exec")        
        sfn = SFNWorkflow(self,"sfn-map", lambdas)
        
        CfnOutput(self, "StatemachineArn", value=sfn.cfn_state_machine.state_machine_arn)
