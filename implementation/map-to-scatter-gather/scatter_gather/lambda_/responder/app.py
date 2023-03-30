#!/usr/bin/env python3
# -*- coding:utf-8 -*-
###
# File: app.py
# Created Date: Thursday, March 16th 2023, 4:53:49 pm
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
import os
import sys
import random
import boto3

logging.basicConfig(format='%(asctime)s %(levelname)-8s %(message)s', level=logging.INFO, datefmt='%Y-%m-%d %H:%M:%S')
logging.getLogger().setLevel(logging.INFO)


SQS_QUEUE_URL = os.getenv('SQS_QUEUE_URL')

sqs = boto3.client('sqs')

def generate_quote(body):
    message_body = body
    daily_charge = random.randint(30,99)
    logging.info(f"message_body: {message_body}")
    logging.info(f"message_body[data]: {message_body['data']}")
    days = int(message_body['data']['days_rental'])
    message_body['data']['price_quote'] = daily_charge * days
    
    return message_body

def lambda_handler(event, context):
    # Print the event object to the logs
    print("Received event: " + json.dumps(event, indent=2))
    # if SQS_QUEUE_URL is not None:
    if 'Records' in event:
        for record in event['Records']:
            if 'body' in record:
                sns_record_body = json.loads(record['body'])
                logging.info(f"sns_record_body: {sns_record_body}")
                body = sns_record_body['responsePayload']['body']
                if (isinstance(body, str)):
                    body = json.loads(sns_record_body['responsePayload']['body'])
                logging.info(f"body: {body}, {type(body)}")
                
                # generate quote here - for now just pass the received quote request
                message_body = generate_quote(body)        
                logging.info(f"message body: {message_body}")
                logging.info(f"send message to: {SQS_QUEUE_URL}")
                response = sqs.send_message(
                    QueueUrl=SQS_QUEUE_URL,
                    MessageBody=json.dumps(message_body)
                )
                logging.info(f"response: {response}")
    else:
        message_body = generate_quote(event)
    
        
    # Return a response
    return {
        'statusCode': 200,
        'body': json.dumps(message_body)
    }