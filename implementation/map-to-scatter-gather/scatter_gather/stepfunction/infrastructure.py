#!/usr/bin/env python3
# -*- coding:utf-8 -*-
###
# File: infrastructure.py
# Created Date: Tuesday, January 24th 2023, 11:32:48 am
# Author: Agostino Di Figlia
# -----
# Copyright (c) 2023 Amazon Web Services
# 
# 2022 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
# This AWS Content is provided subject to the terms of the AWS Customer Agreement available at  
# http://aws.amazon.com/agreement or other written agreement between Customer and either
# Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.
# Note:
# THE SOFTWARE IS PROVIDED AS IS, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
# FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
# COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
# IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
# CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
###
from constructs import Construct
from aws_cdk import (
    aws_stepfunctions as sfn,
    aws_iam as iam,
    aws_logs as log
)
import json
import os
import pathlib

from scatter_gather.lambda_.infrastructure import LambdaStates


class SFNWorkflow(Construct):
    
    def __init__(self, scope: Construct, id_: str, executors: LambdaStates, asl_file: str) -> None:
        super().__init__(scope, id_)
        
        region = os.environ["CDK_DEFAULT_REGION"]
        account = os.environ["CDK_DEFAULT_ACCOUNT"]
        
        log_group = log.LogGroup(self, f"sfn-logroup",
            retention=log.RetentionDays.ONE_WEEK)
        
        
            
        state_machine_exec_role = iam.Role(self, f'sfn-role',
                                           assumed_by=iam.ServicePrincipal(f"states.{region}.amazonaws.com"),
                                           description="sfn execution role")

        state_machine_exec_role.attach_inline_policy(iam.Policy(self, f"{id_}logging",
                                                                statements=[
                                                                    iam.PolicyStatement(
                                                                        actions=["cloudwatch:*", "logs:*"],
                                                                        resources=["*"]
                                                                        )
                                                                    ]
                                                                )
                                                     )
        
        state_machine_exec_role.attach_inline_policy(iam.Policy(self, f"{id_}lambda",
                                                                statements=[
                                                                    iam.PolicyStatement(
                                                                        actions=["lambda:InvokeFunction"],
                                                                        resources=[
                                                                            executors.requester.function_arn,
                                                                            executors.responder.function_arn,
                                                                            executors.aggregator.function_arn
                                                                            ]
                                                                        )
                                                                    ]
                                                                )
                                                     )

        
        
        
        with open(
            str(pathlib.Path(__file__).parent.joinpath(asl_file).resolve())
        ) as sfn_definition_file:
            sfn_definition_data = json.load(sfn_definition_file)
        
        
        self.sfn_substitutions = {
            "REQUESTER_ARN": executors.requester.function_arn,            
            "RESPONDER_ARN": executors.responder.function_arn,
            "AGGREGATOR_ARN": executors.aggregator.function_arn
        }
        
        
        
        self.cfn_state_machine = sfn.CfnStateMachine(self, f"ingestion-sfn",
            definition=sfn_definition_data,
            role_arn=state_machine_exec_role.role_arn,
            definition_substitutions=self.sfn_substitutions,
            state_machine_name=f"{id_}scatter-gather-workflow"
        )

        