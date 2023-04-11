#!/usr/bin/env python3
import os
import aws_cdk as cdk
from cdk_nag import (
    AwsSolutionsChecks,
    NagSuppressions,
    NagPackSuppression
    )

from scatter_gather.original_component import OriginalScatterGatherStack
from scatter_gather.refactored_component import RefactoredlScatterGatherStack


app = cdk.App()
cdk.Aspects.of(app).add(AwsSolutionsChecks(verbose=False))

sfn_scatter_gather = OriginalScatterGatherStack(app, "ScatterGatherWithParallelStack",
                      env=cdk.Environment(
                            account=os.environ["CDK_DEFAULT_ACCOUNT"],
                            region=os.environ["CDK_DEFAULT_REGION"]))

refactored_scatter_gather = RefactoredlScatterGatherStack(app, "ScatterGatherWithSNSStack",
                      env=cdk.Environment(
                            account=os.environ["CDK_DEFAULT_ACCOUNT"],
                            region=os.environ["CDK_DEFAULT_REGION"]))                           

NagSuppressions.add_resource_suppressions([sfn_scatter_gather, refactored_scatter_gather], 
                                        [
                                            NagPackSuppression(id="AwsSolutions-IAM5", reason="resource is set"),
                                            NagPackSuppression(id="AwsSolutions-IAM4", reason="resource is set"),                                            
                                            NagPackSuppression(id="AwsSolutions-SF2", reason="X-Ray not necessary for use case"),
                                            NagPackSuppression(id="AwsSolutions-SF1", reason="not critical for proposed example"),
                                            NagPackSuppression(id="AwsSolutions-SQS3", reason="DLQ not relevant for this example"),
                                            NagPackSuppression(id="AwsSolutions-SQS4", reason="Use of SSL not critical for example use case"),
                                            NagPackSuppression(id="AwsSolutions-SNS2", reason="Server-side encryption not necessary for the sample use case"),
                                            NagPackSuppression(id="AwsSolutions-SNS3", reason="Use of SSL not critical for example use case")                                           
                                        ], 
                                        apply_to_children=True
                                    )


app.synth()
