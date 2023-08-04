#!/usr/bin/env python3
import json
import boto3
from datetime import datetime, timezone
from dateutil.parser import parse
import os
import logging

lambda_client = boto3.client('lambda')
logging.getLogger().setLevel('INFO')

LAMBDA_DEST_FUNCTION_1 = os.getenv('LAMBDA_DEST_FUNCTION_1')
LAMBDA_DEST_FUNCTION_2 = os.getenv('LAMBDA_DEST_FUNCTION_2')


def handler(event, context):
    detail_type = event.get('detail-type')
    
    if detail_type == 'user.review':
        process_review_event(event)
        
    return {
        "status": 200,
        "body": json.dumps(event)
    }


def process_review_event(event):
    rating = event['detail']['rating']
    purchase_history = event['detail']['reviewer']['purchaseHistory']
    total_items_purchased = sum(item['quantity'] for order in purchase_history for item in order['items'])

    if rating >= 4.5 and total_items_purchased <= 10:
        lambda_client.invoke(FunctionName=LAMBDA_DEST_FUNCTION_1, Payload=json.dumps(event))
        logging.info(f"rating >= 4.5 and total_items_purchased({total_items_purchased}) <= 10 -> invoking {LAMBDA_DEST_FUNCTION_1}")
    elif rating < 2 and total_items_purchased > 10:
        lambda_client.invoke(FunctionName=LAMBDA_DEST_FUNCTION_2, Payload=json.dumps(event))
        logging.info(f"rating < 2 and total_items_purchased({total_items_purchased}) > 10 -> invoking {LAMBDA_DEST_FUNCTION_2}")
