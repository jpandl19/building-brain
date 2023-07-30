from flask import Flask, request, jsonify
from api.diagnose import answer_question
from api.db.BuildingBrainCustomFiles import process_file, get_items_by_email, get_all_files, delete_file
from api.db.BuildingBrainUserMessageResponseAudit import add_user_message, get_todays_records_for_email, get_latest_record_for_email, update_item_based_on_secondary_index
from pydash import truncate
from flask_cors import CORS
from jose import jwt
import uuid
import logging
from functools import wraps
import json
from os import environ as env
from typing import Dict

from six.moves.urllib.request import urlopen
import os
from flask import Flask, request, jsonify, _request_ctx_stack, Response
from flask_cors import cross_origin
from jose import jwt
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TOTAL_MAX_RESPONSE_LENGTH = 2000
MAX_QUERY_CHARACTER_LENGTH = 500
MAX_MESSAGES_PER_DAY_FOR_FREE_USERS = 5
load_dotenv()  # take environment variables from .env.
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
USE_VECTOR_DB = os.getenv("USE_VECTOR_DB", None)
USE_SSL = os.getenv("USE_SSL", "False")

if (USE_VECTOR_DB != None):
    USE_VECTOR_DB = True
else:
    USE_VECTOR_DB = False

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "25 per hour",
                    "5 per minute", "1 per second"],
)


def create_metadata_object(response):
    metadata = {}

    return json.dumps(metadata)


def get_roles_from_payload(payload):
    # replace this with the actual namespace you used in the Auth0 action
    namespace = 'https://servicegpt.app'
    roles = payload.get(f"{namespace}/roles", [])
    return roles


def run_auth_checks(requiredRoles=["admin"]):
    auth = non_decorated_auth_check()
    roles = get_roles_from_payload(auth.get("payload", {}))

    if (not auth.get("authenticated", False)):
        raise AuthError({"code": "NOT_AUTHORIZED",
                                 "description": "You are not authorized"}, 401)

    check_roles(roles, requiredRoles)

    return auth, roles


def check_roles(user_roles, required_roles):
    missing_roles = [role for role in required_roles if role not in user_roles]

    # if the user doesn't have any roles, and the required role is ONLY "free", as in the required roles looks like ["free"], then we can let them through
    if (required_roles == ["free"]):
        # anyone and everyone should be able to access resources where the required roles is free
        return

    #  check if the user has the required roles, or if they are an admin
    if missing_roles and (not ("admin" in user_roles)):
        raise AuthError({"code": "INCORRECT_ROLE",
                         "description": "You do not have permission to access this resource."}, 401)


def getPlatformCommonName(platformId):
    return "BuildingBrain"


def convert_to_html_list(array):
    html_string = "<ul>"

    for idx, obj in enumerate(array):
        html_string += f"<li>Reference {idx+1}:"
        html_string += "<ul>"
        html_string += f"<li>Document Name: {obj['documentName']}</li>"
        html_string += f"<li>Page Number: {obj['pageNumber']}</li>"
        html_string += f"<li>Paragraph Number: {obj['paragraphNumber']}</li>"
        html_string += "</ul>"
        html_string += "</li>"

    html_string += "</ul>"

    return html_string


'''
AUTH AND TOKEN FUNCS

'''

# Format error response and append status code.


class AuthError(Exception):
    """
    An AuthError is raised whenever the authentication failed.
    """

    def __init__(self, error: Dict[str, str], status_code: int):
        super().__init__()
        self.error = error
        self.status_code = status_code


@app.errorhandler(AuthError)
def handle_auth_error(ex: AuthError) -> Response:
    """
    serializes the given AuthError as json and sets the response status code accordingly.
    :param ex: an auth error
    :return: json serialized ex response
    """
    response = jsonify(ex.error)
    response.status_code = ex.status_code
    return response


def get_token_auth_header() -> str:
    """Obtains the access token from the Authorization Header
    """
    auth = request.headers.get("Authorization", None)
    if not auth:
        raise AuthError({"code": "authorization_header_missing",
                         "description":
                             "Authorization header is expected"}, 401)

    parts = auth.split()

    if parts[0].lower() != "bearer":
        raise AuthError({"code": "invalid_header",
                        "description":
                            "Authorization header must start with"
                            " Bearer"}, 401)
    if len(parts) == 1:
        raise AuthError({"code": "invalid_header",
                        "description": "Token not found"}, 401)
    if len(parts) > 2:
        raise AuthError({"code": "invalid_header",
                         "description":
                             "Authorization header must be"
                             " Bearer token"}, 401)

    token = parts[1]
    return token


def requires_scope(required_scope: str) -> bool:
    """Determines if the required scope is present in the access token
    Args:
        required_scope (str): The scope required to access the resource
    """
    token = get_token_auth_header()
    unverified_claims = jwt.get_unverified_claims(token)
    if unverified_claims.get("scope"):
        token_scopes = unverified_claims["scope"].split()
        for token_scope in token_scopes:
            if token_scope == required_scope:
                return True
    return False


def non_decorated_auth_check():
    token = get_token_auth_header()
    jsonurl = urlopen(f"{AUTH0_DOMAIN}/.well-known/jwks.json")
    jwks = json.loads(jsonurl.read())
    try:
        unverified_header = jwt.get_unverified_header(token)
    except jwt.JWTError as jwt_error:
        raise AuthError({"code": "invalid_header",
                        "description":
                            "Invalid header. "
                            "Use an RS256 signed JWT Access Token"}, 401) from jwt_error
    if unverified_header["alg"] == "HS256":
        raise AuthError({"code": "invalid_header",
                         "description":
                         "Invalid header. "
                         "Use an RS256 signed JWT Access Token"}, 401)
    rsa_key = {}
    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"]
            }
    if rsa_key:
        try:
            payload = jwt.decode(
                token,
                rsa_key,
                algorithms=["RS256"],
                audience=AUTH0_AUDIENCE,
            )
        except jwt.ExpiredSignatureError as expired_sign_error:
            raise AuthError({"code": "token_expired",
                            "description": "token is expired"}, 401) from expired_sign_error
        except jwt.JWTClaimsError as jwt_claims_error:
            raise AuthError({"code": "invalid_claims",
                            "description":
                                "incorrect claims,"
                                " please check the audience and issuer"}, 401) from jwt_claims_error
        except Exception as exc:
            raise AuthError({"code": "invalid_header",
                            "description":
                                "Unable to parse authentication"
                                " token."}, 401) from exc
        return {"authenticated": True, "payload": payload}


def requires_auth(func):
    """Determines if the access token is valid
    """

    @wraps(func)
    def decorated(*args, **kwargs):
        token = get_token_auth_header()
        jsonurl = urlopen(f"{AUTH0_DOMAIN}/.well-known/jwks.json")
        jwks = json.loads(jsonurl.read())
        try:
            unverified_header = jwt.get_unverified_header(token)
        except jwt.JWTError as jwt_error:
            raise AuthError({"code": "invalid_header",
                            "description":
                                "Invalid header. "
                                "Use an RS256 signed JWT Access Token"}, 401) from jwt_error
        if unverified_header["alg"] == "HS256":
            raise AuthError({"code": "invalid_header",
                             "description":
                                 "Invalid header. "
                                 "Use an RS256 signed JWT Access Token"}, 401)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
        if rsa_key:
            try:
                payload = jwt.decode(
                    token,
                    rsa_key,
                    algorithms=["RS256"],
                    audience=AUTH0_AUDIENCE,
                )
            except jwt.ExpiredSignatureError as expired_sign_error:
                raise AuthError({"code": "token_expired",
                                "description": "token is expired"}, 401) from expired_sign_error
            except jwt.JWTClaimsError as jwt_claims_error:
                raise AuthError({"code": "invalid_claims",
                                "description":
                                    "incorrect claims,"
                                    " please check the audience and issuer"}, 401) from jwt_claims_error
            except Exception as exc:
                raise AuthError({"code": "invalid_header",
                                "description":
                                    "Unable to parse authentication"
                                    " token."}, 401) from exc

            _request_ctx_stack.top.current_user = payload
            return func(*args, **kwargs)
        raise AuthError({"code": "invalid_header",
                         "description": "Unable to find appropriate key"}, 401)

    return decorated


'''
ROUTES AND API FUNCS
'''


@app.route("/")
@limiter.limit("1 per second", override_defaults=True)
def helloWorld():
    return '{message: "Hello from BuildingBrain", version: "0.0.1"}'


@app.route("/health")
@limiter.limit("1 per second", override_defaults=True)
def health_check():
    return '{"healthcheck": "success"}'


@app.route('/api/files', methods=['POST', 'GET', 'OPTIONS', 'DELETE'])
@limiter.limit("1000 per minute", override_defaults=True)
@cross_origin()
def manage_files():
    auth, roles = run_auth_checks(["admin"])
    user_email = auth.get("payload", {}).get('email', 'no_email')
    platformId = int(request.args.get('platformId', 0))

    if request.method == 'DELETE':
        file_id = request.args.get('fileId', None)
        if file_id is None:
            return jsonify({'error': 'No fileId provided.'}), 400

        # Here, we call the delete function, assuming it takes the file_id as a parameter
        # and returns a boolean value to indicate whether the deletion was successful.
        try:
            success = delete_file(file_id)
            if success:
                return jsonify({'message': f'File {file_id} successfully deleted.'}), 200
            else:
                return jsonify({'error': f'Failed to delete file {file_id}.'}), 500
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    if request.method == 'GET':
        onlyUserItems = int(request.args.get('onlyUserItems', 0))
        file_items = []
        if onlyUserItems == 1:
            file_items = get_items_by_email(user_email)
        else:
            file_items = get_all_files()
        return jsonify(message="Successfully retrieved files", files=file_items)

    # check if the post request has the file part
    if 'file' not in request.files:
        return jsonify(error='No file part in the request'), 400
    file = request.files['file']
    filename = request.form.get('filename')

    # if user does not select file, browser can submit an empty part without filename
    if file.filename == '':
        return jsonify(error='No selected file'), 400

    # get user data
    # org_id = request.form.get('orgId')

    # process the file
    uploadedRecord = process_file(file, filename, user_email, platformId)
    if uploadedRecord != None:
        return jsonify(success=True, file=uploadedRecord), 200

    return jsonify(error='Invalid file type. Only .pdf and .txt files are allowed'), 400


@app.route('/api/chat/feedback', methods=['GET', 'POST', 'OPTIONS'])
@limiter.limit("100 per minute", override_defaults=True)
@cross_origin()
def chat_feedback():
    auth, roles = run_auth_checks(["free"])
    if request.method == 'GET':
        return jsonify(message='the GET method is not supported for the feedback route yet')

    data = request.get_json()

    if 'id' not in data or 'feedback' not in data:
        return jsonify({'error': 'Request JSON must contain valid "id" and "feedback" fields.'}), 400

    item_id = data['id']
    feedback_value = data['feedback']

    try:
        response = update_item_based_on_secondary_index(
            item_id, feedback_value)
        return jsonify(response), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat', methods=['GET', 'POST', 'OPTIONS'])
@limiter.limit("100 per minute", override_defaults=True)
@cross_origin()
def chat():
    platformId = int(request.args.get('platformId', 0))
    roles_to_check = ["free"]
    # we're running our auth check universally, however the roles required for each platform may differ, so we ant to check that here
    auth, roles = run_auth_checks(roles_to_check)

    if request.method == 'GET':
        return jsonify(message='Hi Welcome to the FerryBuilding Central Brain')

    platformId = int(request.json.get('platformId', 0))

    if request.method == 'POST':
        try:
            auth_payload = auth.get("payload", {})
            user_email = auth_payload.get('email', 'no_email')

            # lets check whether the user has reached their message limit for the month (only enforce a limit for free users)
            # record_count = get_todays_records_for_email(user_email)

            user_message = request.json.get('message', '')
            max_response_length = int(
                request.json.get('max_response_length', 150))

            if (max_response_length >= TOTAL_MAX_RESPONSE_LENGTH):
                max_response_length = TOTAL_MAX_RESPONSE_LENGTH

            if ('echo:' in user_message):
                bot_response = f"You said: {user_message}"
                echo_test_id = str(uuid.uuid4())
                return jsonify(message=bot_response, id=echo_test_id)
            else:
                if (len(user_message) > MAX_QUERY_CHARACTER_LENGTH):
                    user_message = truncate(
                        user_message, MAX_QUERY_CHARACTER_LENGTH)

                if (len(user_message) <= 0 or user_message == None):
                    bot_response = "I received an empty message there! Please send a message with more than 0 characters."

                selected_model = request.json.get('model', 'claude-2')

                bot_response = 'No response defined'
                response = None
                #  lets get the previous message the user sent, and use that as part of the context for the next message, so pastorgpt can remember the conversation
                # previous_message = get_latest_record_for_email(user_email)
                previous_message = None
                # lets get the response from the chat model

                if (previous_message != None):
                    response, top_results = answer_question(question=user_message, model=selected_model,
                                                            previous_message=previous_message, platformId=platformId, max_response_length=max_response_length, use_vector_db=USE_VECTOR_DB, debug=False)
                else:
                    response, top_results = answer_question(question=user_message, model=selected_model,
                                                            platformId=platformId, max_response_length=max_response_length, use_vector_db=USE_VECTOR_DB, debug=False)

                bot_response = response.completion.strip()
                # now lets store the question and response for our own audit and product improvement purposes
                # if(platformId == 0):
                payload, response = add_user_message(user_email=user_email, platformId=platformId, user_message=user_message, metadata=create_metadata_object(
                    response), message_response=bot_response, model_name=selected_model)
                if response['ResponseMetadata']['HTTPStatusCode'] == 200:
                    print(
                        f"User {user_email} - question and model response was successfully added to the audit table")
                else:
                    print("Error adding user message.")

                id = payload.get("id")
            references = []
            for result in top_results:
                references.append({
                    "documentName": result['filename'],
                    "pageNumber": result['pageNumber'],
                    "paragraphNumber": result['paragraphNumber'],
                    "text": result['text'],
                })

            # lastly lets make sure to send the message to our slack audit channel, so we can easily see user interactions
            return jsonify(message=bot_response, references=references, id=id)
        except Exception as e:
            print(e)
            return jsonify(message='I apologize, an error occurred while I was thinking about your message. Please try again or contact our support at <a href=\"mailto:questions@pastorgpt.app\">questions@pastorgpt.app</a>.', error=e.args)

def start_server():
    if (USE_SSL == 'True'):
        print("Using SSL")
        app.run(debug=True, host="0.0.0.0", port=5001, ssl_context=(os.path.abspath('./api/ssl/localhost.crt'),
                                                                    os.path.abspath('./api/ssl/localhost.key')))
    else:
        app.run(debug=True, host="0.0.0.0", port=5000)


if __name__ == '__main__':
    start_server()
