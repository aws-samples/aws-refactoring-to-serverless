#!/usr/bin/env python3
# -*- coding:utf-8 -*-
###
# File: iam.py
# Created Date: Friday, November 18th 2022, 8:58:40 am
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
from aws_cdk import aws_iam as iam

class Iam(Construct):
    @property
    def arn(self):
        return self._role.role_arn

    @property
    def role(self):
        return self._role

    @property
    def name(self):
        return self._role.role_name

    def __init__(
        self,
        scope: Construct,
        id: str,
        assumed_by: str,
        managed_policies: list = None,
    ) -> None:
        super().__init__(scope, id)

        if managed_policies:
            managed_policies = self._handle_managed_policy_names(managed_policies)
        else:
            managed_policies = None

        self._role = iam.Role(
            self,
            id,
            assumed_by=iam.ServicePrincipal(assumed_by),
            managed_policies=managed_policies,
        )

    def _handle_managed_policy_names(self, managed_policy_names: list) -> list:
        managed_policy_objects = []
        for policy in managed_policy_names:
            managed_policy_objects.append(
                iam.ManagedPolicy.from_aws_managed_policy_name(policy)
            )

        return managed_policy_objects
