#!/usr/bin/env python3
# -*- coding:utf-8 -*-
###
# File: sfn_component copy.py
# Created Date: Thursday, March 16th 2023, 4:50:22 pm
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
from aws_cdk import (
    Stack,
    aws_sqs as sqs,
    aws_sns as sns,
    # aws_lambda_destinations as destinations,
    aws_sns_subscriptions as subscriptions,
    aws_lambda_event_sources as _event,
    Duration,
    CfnOutput
)
from constructs import Construct
from scatter_gather.lambda_.infrastructure import LambdaStates

class RefactoredlScatterGatherStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
            
        sns_fanout = sns.Topic(
            self, "ScatterTopic",
            topic_name="scatter-topic"
        )
        
        # sns_destination = destinations.SnsDestination(sns_fanout)
        sqs_aggregator = sqs.Queue(self, "sqs-aggregator", visibility_timeout=Duration.seconds(90))
        lambdas = LambdaStates(self, "refactor-lambda", requester_sns_topic=sns_fanout, responder_sqs_queue=sqs_aggregator)
        
        for responder in lambdas.responder:
            sns_fanout.add_subscription(subscriptions.LambdaSubscription(responder))
        
        lambdas.aggregator.add_event_source(_event.SqsEventSource(queue=sqs_aggregator, batch_size=len(lambdas.responder), max_batching_window=Duration.minutes(1)))
        
        resp_index = 1
        for responder in lambdas.responder:
            CfnOutput(self, f"ResponderFunctionName-{resp_index}", value=responder.function_name)
            resp_index +=1
            
        CfnOutput(self, "RequesterFunctionName", value=lambdas.requester.function_name)
        CfnOutput(self, "AggregatorFunctionName", value=lambdas.aggregator.function_name)