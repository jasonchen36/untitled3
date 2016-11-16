TAXplan API
09 Nov 2016

Environment Prerequisites

1. node.js >= 0.10.x
node -v

2. npm >= 1.3.x
npm -v

3. MySQL
TAXplan API Installation

1. Clone the repository:
https://bitbucket.org/ellefsontech/taxplan.api

2. npm install

3. Database

AWS: Credentials in lastpass (taxplan-dev database)
Dump this DB and Import it locally

4. Config
A sample config file is provided as /config/sample_config.js. 

In addition, the following environment variables need to be set:
NODE_ENV=development
SET DOMAIN="example.com"
SET SESSION_SECRET="somesecret"
SET STRIPE_SECRET_KEY="1234"
SET STRIPE_PUBLIC_KEY="1234"
SET POSTAGEAPP_API_KEY="1234"

5. Running Automated Tests
node node_modules/istanbul/lib/cli.js cover node_modules/mocha/bin/_mocha test/mocha/**/*.js