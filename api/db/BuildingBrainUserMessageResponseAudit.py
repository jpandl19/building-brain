import boto3
from botocore.exceptions import ClientError
from datetime import datetime
import os
import json
import uuid
from boto3.dynamodb.conditions import Key, Attr
# AWS credentials and region configuration
aws_access_key_id = os.getenv("AWS_ACCESS_KEY")
aws_secret_access_key = os.getenv("AWS_SECRET_KEY")
region_name = os.getenv("AWS_REGION", 'us-east-1')

# Initialize a DynamoDB client
dynamodb = boto3.resource(
    'dynamodb',
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key,
    region_name=region_name
)

TABLE_NAME = "BuildingBrainUserMessageResponseAudit"

def update_item_based_on_secondary_index(id, feedback_value):
    # Assuming 'secondary_index_name' is the name of your secondary index
    secondary_index_name = 'BuildingBrainUserMessageResponseAudit-Id-Index'

    # Query the secondary index to find the primary key attributes
    response = dynamodb.Table(TABLE_NAME).query(
        IndexName=secondary_index_name,
        KeyConditionExpression=Key('id').eq(id)
    )

    items = response['Items']
    if not items:
        raise ValueError(f"No items found with ID {id}")

    # Use the first item's primary key attributes to update the item
    # (assuming IDs are unique so there's only one item)
    item = items[0]
    user_email = item['userEmail']
    created_date = item['createdDate']

    return update_user_message_with_feedback(user_email, created_date, feedback_value)

def update_user_message_with_feedback(user_email, created_date, feedback_value):
    table = dynamodb.Table(TABLE_NAME)
    feedback_value = json.dumps(feedback_value)
    response = table.update_item(
        Key={
            'userEmail': user_email,
            'createdDate': created_date
        },
        UpdateExpression="SET feedback = :feedback",
        ExpressionAttributeValues={
            ':feedback': feedback_value
        },
        ReturnValues="UPDATED_NEW"
    )

    return response

# Add a user message to the table


def add_user_message(user_email, user_message, metadata, message_response, model_name, platformId):
    table = dynamodb.Table(TABLE_NAME)
    created_date = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%f")
    item_uuid = str(uuid.uuid4())
    feedbackJsonDump = json.dumps(
        {"sentiment": None, "note": "No note given"})
    payload = {
        'id': item_uuid,
        'userEmail': user_email,
        'createdDate': created_date,
        'updatedDate': created_date,
        'userMessage': user_message,
        'metadata': metadata,
        'messageResponse': message_response,
        'platformId': platformId,
        'modelName': model_name,
        # Below is the proposed structure for the mvp feedback object
        'feedback': feedbackJsonDump
    }
    response = table.put_item(
        Item=payload
    )

    return payload, response


def get_todays_records_for_email(email):
    table = dynamodb.Table(TABLE_NAME)

    # Format today's date as a string
    today = datetime.utcnow().strftime("%Y-%m-%d")

    # Use a query operation with KeyConditionExpression
    response = table.query(
        IndexName="userEmail-createdDate-idx",
        KeyConditionExpression="userEmail = :user_email AND begins_with(createdDate, :createdDate)",
        ExpressionAttributeValues={
            ":user_email": email,
            ":createdDate": today
        }
    )
    record_count = len(response['Items'])
    print(
        f'Total number of records for {email} with today\'s date: {record_count}')

    return record_count


def get_latest_record_for_email(email):
    table = dynamodb.Table(TABLE_NAME)

    response = table.query(
        IndexName="userEmail-createdDate-idx",
        KeyConditionExpression="userEmail = :user_email",
        ExpressionAttributeValues={":user_email": email},
        ScanIndexForward=False,  # Sort results in descending order by createdDate
        Limit=1  # Retrieve only the latest record
    )

    if response['Items']:
        return response['Items'][0]
    else:
        return None

def create_table():
    # Create the DynamoDB table.
    table = dynamodb.create_table(
        TableName=TABLE_NAME,
        KeySchema=[
            {
                'AttributeName': 'id',
                'KeyType': 'HASH'
            },
        ],
        AttributeDefinitions=[
            {
                'AttributeName': 'id',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'email',
                'AttributeType': 'S'
            },
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        },
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'userEmail-createdDate-idx',
                'KeySchema': [
                    {
                        'AttributeName': 'email',
                        'KeyType': 'HASH'
                    },
                ],
                'Projection': {
                    'ProjectionType': 'ALL',
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5,
                }
            },
        ]
    )

if __name__ == '__main__':
    create_table()