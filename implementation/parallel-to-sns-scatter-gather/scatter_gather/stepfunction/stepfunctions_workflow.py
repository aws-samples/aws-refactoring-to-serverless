#!/usr/bin/env python3
# -*- coding:utf-8 -*-
###
# File: stepfunctions_workflow.py
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
    aws_stepfunctions_tasks as sfn_tasks,
    Duration
)

from scatter_gather.lambda_.lambda_functions import LambdaStates


class SFNWorkflow(Construct):

    def __init__(self, scope: Construct, id_: str, executors: LambdaStates) -> None:
        super().__init__(scope, id_)

        # Define the requester state
        requester = sfn_tasks.LambdaInvoke(self, "Requester",
                                           lambda_function=executors.requester,
                                           result_path="$",
                                           result_selector={"request": sfn.JsonPath.string_to_json(
                                               sfn.JsonPath.string_at("$.Payload.body"))},
                                           retry_on_service_exceptions=True
                                           )

        # Define the parallel state
        parallel_state = sfn.Parallel(self, "Parallel",
                                      result_selector={"quotes": sfn.JsonPath.object_at("$")})
        # Define the responder state
        resp_index = 1
        for resp_lambda in executors.responder:
            responder = sfn_tasks.LambdaInvoke(self, f"Responder-{resp_index}",
                                               lambda_function=resp_lambda,
                                               result_path="$",
                                               input_path="$.request",
                                               output_path="$.quote",
                                               result_selector={
                                                   "quote": sfn.JsonPath.string_to_json(sfn.JsonPath.string_at("$.Payload.data"))
                                               },
                                               retry_on_service_exceptions=True
                                               )
            parallel_state.branch(responder)
            resp_index += 1

        # Create the state machine
        self.cfn_state_machine = sfn.StateMachine(self, f"{id_}scatter-gather-workflow",
                                                  state_machine_name="ParallelStateForScatterGather",
                                                  definition=requester.next(
                                                      parallel_state),
                                                  timeout=Duration.minutes(5)
                                                  )
