const AWS = require("aws-sdk");

AWS.config.region = "us-east-1";
const cognito = new AWS.CognitoIdentityServiceProvider();
const chance = require("chance").Chance();

const randomPassword = () =>
  // needs number, special char, upper and lower case
  `${chance.string({ length: 8 })}B!gM0uth`;

const anAuthenticatedUser = function* anAuthenticatedUser() {
  const userpoolId = process.env.cognito_user_pool_id;
  const clientId = process.env.cognito_server_client_id;

  const firstName = chance.first();
  const lastName = chance.last();
  const username = `test-${firstName}-${lastName}-${chance.string({
    length: 8
  })}`;
  const password = randomPassword();
  const email = `${firstName}-${lastName}@big-mouth.com`;

  const createReq = {
    UserPoolId: userpoolId,
    Username: username,
    MessageAction: "SUPPRESS",
    TemporaryPassword: password,
    UserAttributes: [
      { Name: "given_name", Value: firstName },
      { Name: "family_name", Value: lastName },
      { Name: "email", Value: email }
    ]
  };
  yield cognito.adminCreateUser(createReq).promise();

  console.log(`[${username}] - user is created`);

  const req = {
    AuthFlow: "ADMIN_NO_SRP_AUTH",
    UserPoolId: userpoolId,
    ClientId: clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password
    }
  };
  const resp = yield cognito.adminInitiateAuth(req).promise();

  console.log(`[${username}] - initialised auth flow`);

  const challengeReq = {
    UserPoolId: userpoolId,
    ClientId: clientId,
    ChallengeName: resp.ChallengeName,
    Session: resp.Session,
    ChallengeResponses: {
      USERNAME: username,
      NEW_PASSWORD: randomPassword()
    }
  };
  const challengeResp = yield cognito
    .adminRespondToAuthChallenge(challengeReq)
    .promise();

  console.log(`[${username}] - responded to auth challenge`);

  return {
    username,
    firstName,
    lastName,
    idToken: challengeResp.AuthenticationResult.IdToken
  };
};

module.exports = {
  anAuthenticatedUser
};
