#!/usr/bin/env python3
# -*- coding:utf-8 -*-
###
# File: infrastructure.py
# Created Date: Thursday, March 16th 2023, 4:53:02 pm
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
import pathlib
from aws_cdk import (
    aws_lambda as lambda_,
    aws_lambda_destinations as destinations,
    aws_sqs as sqs,
    aws_sns as sns,
    Duration
)
import os

# check doc https://constructs.dev/packages/@aws-cdk/aws-batch-alpha/v/2.49.0-alpha.0#aws-batch-construct-library

class LambdaStates(Construct):
    
    def __init__(self, scope: Construct, id_: str, requester_sns_topic:sns.ITopic = None, responder_sqs_queue:sqs.IQueue = None, **kwargs) -> None:
        super().__init__(scope, id_)
        
        requester_destination = None
        if requester_sns_topic is not None:
            requester_destination = destinations.SnsDestination(requester_sns_topic)
            
        self.requester = lambda_.Function(
            self,
            f"requester",
            runtime=lambda_.Runtime.PYTHON_3_9,
            # reserved_concurrent_executions=lambda_reserved_concurrency,
            code=lambda_.Code.from_asset(str(pathlib.Path(__file__).parent.joinpath("requester").resolve())),
            handler="app.lambda_handler",
            on_success=requester_destination,
            tracing=lambda_.Tracing.ACTIVE
        )
        
        # necessary since lambda destinations only works with asynchronous invocations. Using lambda with SQS is synchronous (https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html). 
        responder_destination = None
        if responder_sqs_queue is not None:
            responder_destination = destinations.SqsDestination(responder_sqs_queue) 
        
        # list of responders based on recipients defined in cdk.json 
        
        recipients_list = self.node.try_get_context("recipients")
        self.responder = []
        for recipient in recipients_list:
            env = dict(recipients_list[recipient])
            env['vendor'] = recipient
            self.responder.append(lambda_.Function(
                self,
                f"responder-{recipient}",
                runtime=lambda_.Runtime.PYTHON_3_9,
                # reserved_concurrent_executions=lambda_reserved_concurrency,
                code=lambda_.Code.from_asset(str(pathlib.Path(__file__).parent.joinpath("responder").resolve())),
                handler="app.lambda_handler",
                on_success=responder_destination,
                environment= env,
                tracing=lambda_.Tracing.ACTIVE
            )
        )
        
        self.aggregator = lambda_.Function(
            self,
            f"aggregator",
            runtime=lambda_.Runtime.PYTHON_3_9,
            # reserved_concurrent_executions=lambda_reserved_concurrency,
            code=lambda_.Code.from_asset(str(pathlib.Path(__file__).parent.joinpath("aggregator").resolve())),
            handler="app.lambda_handler",
            tracing=lambda_.Tracing.ACTIVE,
            timeout=Duration.seconds(30)
        )
        
        