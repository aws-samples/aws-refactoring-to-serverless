#!/usr/bin/env python3
# -*- coding:utf-8 -*-
###
# File: app.py
# Created Date: Thursday, March 16th 2023, 4:53:36 pm
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
import json
import logging
import uuid

logging.basicConfig(format='%(asctime)s %(levelname)-8s %(message)s', level=logging.INFO, datefmt='%Y-%m-%d %H:%M:%S')
logging.getLogger().setLevel(logging.INFO)


# Lambda function handler enriches the received event with an unique id for quote request and returns it
def lambda_handler(event, context):
    
    # create a unique id for the quote request
    uuid_quote = uuid.uuid4()
    # assumption data is present in event
    if 'data' in event:        
        event['data']['uuid'] = str(uuid_quote)
    else: 
        raise Exception("data not found in event")
    
    message = event
    logging.info(f"sending quote request: {message}")
    
    # Return a response
    return {
        'statusCode': 200,
        'body': json.dumps(message)
    }