#!/usr/bin/env python3
import os

import aws_cdk as cdk

from scatter_gather.sfn_map_component import SFNScatterGatherStack
from scatter_gather.refactored_component import ScatterGatherStack


app = cdk.App()
SFNScatterGatherStack(app, "ScatterGatherStack",
                      env=cdk.Environment(
                            account=os.environ["CDK_DEFAULT_ACCOUNT"],
                            region=os.environ["CDK_DEFAULT_REGION"]))

ScatterGatherStack(app, "RefactoredScatterGather",
                      env=cdk.Environment(
                            account=os.environ["CDK_DEFAULT_ACCOUNT"],
                            region=os.environ["CDK_DEFAULT_REGION"]))                           

app.synth()
