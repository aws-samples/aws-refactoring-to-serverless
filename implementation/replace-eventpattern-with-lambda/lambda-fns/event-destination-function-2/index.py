#!/usr/bin/env python3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info('Hello from Rule2 handler function')
    logger.info(f'Received Event: {json.dumps(event)}')
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Rule2 handler function')
    }
