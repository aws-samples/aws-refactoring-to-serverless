import json

def lambda_handler(event, context):
    # TODO implement
    print ('Reward updated for the product id:', event['product_id'])
    return {
        'statusCode': 200,
        'update_reward' : True,
        **event
    }
    
