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


logging.basicConfig(format='%(asctime)s %(levelname)-8s %(message)s', level=logging.INFO, datefmt='%Y-%m-%d %H:%M:%S')
logging.getLogger().setLevel(logging.INFO)

# get environment variables
BASE_RATE = os.getenv('base_rate')
VENDOR = os.getenv('vendor')

# function generates the price quote for the rental company(vendor)
def generate_price_quote(body):
    message_body = body
    daily_charge = int(BASE_RATE)
    logging.info(f"message_body (before): {message_body}")
    # create price quote based on days of rental
    days = int(message_body['data']['days_rental'])
    message_body['data']['price_quote'] = daily_charge * days
    message_body['data']['vendor'] = VENDOR
    logging.info(f"message_body (after): {message_body}")
    return message_body

def get_message_body_json(record):
    sns_record = record['Sns']
    sns_message = json.loads(sns_record['Message'])
    body = sns_message['responsePayload']['body']
    if (isinstance(body, str)):
        body = json.loads(sns_message['responsePayload']['body'])
    logging.debug(f"body: {body}, {type(body)}")
    return body
# lambda function receives quote request from the customer and generates the price quote.
# lambda functions supports both solutions step function and sns.
def lambda_handler(event, context):

    logging.debug("Received event: " + json.dumps(event, indent=2))
    # sns use case
    if 'Records' in event:
        for record in event['Records']:
            if 'Sns' in record:
                body = get_message_body_json(record)                
                # generate quote here - for now just pass the received quote request
                message_body = generate_price_quote(body)
    else: # step function use case
        message_body = generate_price_quote(event)
    
    logging.info(f"message_body: {message_body}")
        
    # Return a response
    return {
        'statusCode': 200,
        'data': json.dumps(message_body['data'])
    }