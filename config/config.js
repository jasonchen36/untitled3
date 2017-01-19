/*jslint node: true */

'use strict';

var _ = require('lodash');
var path = require('path');
var rootPath = path.join(__dirname + '/..');

module.exports = {
    domain: process.env.TAXPLAN_API_DOMAIN,
    api: {
        name: 'TAXplan',
        timezone: 'America/Toronto',
        dateOutputFormat: 'MM/DD/YY hh:ss A',
        dateInputFormat: 'YYYY-MM-DD',
        currentProductId: 10
    },
    api_root_path: process.env.TAXPLAN_API_ROOT,
    root: rootPath,
    port: process.env.TAXPLAN_API_SERVER_PORT,
    ipaddr : '127.0.0.1',
    database: {
        debugSQL: false,
        client:'mysql',
        connection: {
            host: process.env.TAXPLAN_API_MYSQL_HOST,
            port: process.env.TAXPLAN_API_MYSQL_PORT,
            user: process.env.TAXPLAN_API_MYSQL_USER,
            password: process.env.TAXPLAN_API_MYSQL_PASSWORD,
            database: process.env.TAXPLAN_API_MYSQL_DATABASE,
            charset: 'utf8'
        }
    },
    // The secret should be set to a non-guessable string that
    // is used to compute a session hash
    sessionSecret: process.env.TAXPLAN_API_SESSION_SECRET,
    JWTExpires: '1h',
    //We need to think about storage, possibly s3
    uploadDir: path.join(__dirname + '/../uploads'),
    email: {
        enabled: process.env.TAXPLAN_API_EMAIL_ENABLED,
        admin: process.env.TAXPLAN_API_ADMIN_EMAIL,
        templates: {
            welcome: 'welcome',
            password_reset: 'password_reset',
            tax_return_submitted: 'tax_return_submitted',
            comment: 'comment',
            finish_questionnaire: 'questionnaire_finished',
            payment: 'payment',
            profile_created: 'profile_created',
            document_uploaded: 'document_uploaded',
            message_from_taxpro: 'message_from_taxpro'
        },
        submittedMessage: 'This is an automated message to let you know your taxpro will be assigned to you shortly.  In the meantime you can access your customized tax checklist by going to MY DOCUMENTS.  Once you have your documents ready you can easily upload them into MY DOCUMENTS for your taxpro to process.  If at any time you have a question for us simply leave us a message or call 1-855…..to be connected with a TAXplan Customer Service Rep.',
        submittedSubject: 'Tax return submitted',
        welcomeMessage: '{{firstName}}, welcome to your TAXplan dashboard!  This is an automated message to let you know that your TAXpro will be assigned to you within 24 hours or by the next business day.  Your TAXprofile generated a checklist for you to use as a guide for the tax documents we will need from you in order to prepare your return.  Please feel free to start uploading your tax documents or leave a message for your TAXpro.',
        welcomeSubject: 'Thank you for choosing TAXplan--welcome to the TAXplanning Revolution!',
    },
    onesignal: {
        restApiKey: process.env.TAXPLAN_API_ONSIGNAL_REST_API_KEY,
        appId: process.env.TAXPLAN_API_ONESIGNAL_APP_ID
    },
    stripe: {
        secret: process.env.TAXPLAN_API_STRIPE_SECRET_KEY,
        key: process.env.TAXPLAN_API_STRIPE_PUBLIC_KEY
    },
    postageapp: {
        api_key: process.env.TAXPLAN_API_POSTAGEAPP_API_KEY
    },
    thumbnail: {
        baseUploadUrl: process.env.TAXPLAN_API_BASE_UPLOAD_URL,
        baseThumbnailUrl: process.env.TAXPLAN_API_BASE_THUMB_URL,
        destPath: path.join(__dirname + '/../thumb'),
        width: 100
    },
    accessControlAllowOrigin: process.env.TAXPLAN_API_CORS_ALLOW_ORIGIN
};
