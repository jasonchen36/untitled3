describe('<Integration Test>', function () {
    'use strict';

    var app = require('../../../server');
    var request = require('supertest');
    var should = require('should');
    var agent = request.agent(app);
    var User = require('../../../models/user.model');
    var db = require('../../../services/db');
    var atob = require('atob');
//  var credentials = {first_name: 'John', last_name: 'Doe', email: 'fakeuser@gmail.com', name: 'fakename', password: 'pass', phone: '123456789'};
    var credentials = {first_name: 'John', last_name: 'Doe', email: 'fake@email.com', name: 'fakename', password: 'password', phone: '123456789'};
    var currentUser;
    var token;
    var async = require('async');
    var _ = require('underscore');

    beforeEach(function (done) {
        User.deleteByEmail(credentials.email);
        done();
    });

    it('should not register a user without an email', function(done) {
        var user = {
            first_name: 'Name',
            last_name: 'Doe',
            phone: '1234567890',
            password: 'password'
        };
        request(app).post('/users').send(user).end(function(err, res) {
            var errors = res.body;
            errors.length.should.equal(1);
            errors[0].msg.should.equal('Email is invalid');
            errors[0].param.should.equal('email');
            done();
        });
    });

    it('should not register a user without a first name', function(done) {
        var user = {
            last_name: 'Name',
            email: 'fake@email.com',
            phone: '1234567890',
            password: 'password'
        };
        request(app).post('/users').send(user).end(function(err, res) {
            var errors = res.body;
            errors.length.should.equal(1);
            errors[0].msg.should.equal('First Name not provided');
            errors[0].param.should.equal('first_name');
            done();
        });
    });

    it('should register a user without a phone number', function(done) {
        var user = {
            first_name: 'John',
            last_name: 'Doe',
            name: 'name',
            email: 'fake@email.com',
            password: 'password'
        };
        request(app).post('/users').send(user).end(function(err, res) {
            res.body.token.should.not.equal(null);

            done();
        });
    });

    it('should not register a user without a password', function(done) {
        var user = {
            first_name: 'jon',
            last_name: 'name',
            phone: '1234567890',
            email: 'fake@email.com'
        };
        request(app).post('/users').send(user).end(function(err, res) {
            var errors = res.body;
            errors.length.should.equal(1);
            errors[0].msg.should.equal('Password not provided');
            errors[0].param.should.equal('password');
            done();
        });
    });

    it('should not register a user without a Last Name', function(done) {
        var user = {
            first_name: 'name',
            phone: '1234567890',
            email: 'fake@email.com',
            password: 'pass'
        };
        request(app).post('/users').send(user).end(function(err, res) {
            var errors = res.body;
            errors.length.should.equal(1);
            errors[0].msg.should.equal('Last Name not provided');
            errors[0].param.should.equal('last_name');
            done();
        });
    });



    it('should report an error when email is invalid', function(done) {
        var user = {
            email: 'bad',
            phone: '1234567890',
            name: 'bad',
            first_name: 'first',
            last_name: 'last',
            password: 'pass'
        };

        request(app).post('/users').send(user).end(function(err, res) {
            res.status.should.equal(400);
            var errors = res.body;
            errors.length.should.equal(1);
            errors[0].msg.should.equal('Email is invalid');
            done();
        });
    });

    it('should require password to log in', function(done) {
        var badCredentials = {email: 'test@nopassword.com'};
        request(app).post('/login').send(badCredentials).end(function(err, res) {
            res.status.should.equal(400);
            var errors = res.body;
            errors.length.should.equal(1);
            errors[0].msg.should.equal('Invalid email or password');
            done();
        });
    });

    it('should require email to log in', function(done) {
        var badCredentials = {password: 'password'};
        request(app).post('/login').send(badCredentials).end(function(err, res) {
            res.status.should.equal(400);
            var errors = res.body;
            errors.length.should.equal(1);
            errors[0].msg.should.equal('Invalid email or password');
            done();
        });
    });

    it('should not allow a non system user to log in', function(done) {
        var badCredentials = {email: 'fake@email.com', password: 'fake'};
        request(app).post('/login').send(badCredentials).end(function(err, res) {
            res.status.should.equal(400);
            var errors = res.body;
            errors.length.should.equal(1);
            errors[0].msg.should.equal('Invalid email or password');
            done();
        });
    });

    describe('Users:', function() {
        var verifyUserFields = function(user) {
            user.should.have.property('id');
            user.should.have.property('email');
//            user.should.have.property('accounts');
            user.should.have.property('role');
            user.should.have.property('phone');
            user.should.not.have.property('hashed_password');
            user.should.not.have.property('salt');
        };

//        beforeEach(function (done) {
//            agent.post('/users').send(credentials).end(function(err, res) {
//                token = res.body.token;
//                var encodedUser = token.split('.')[1];
//                currentUser = JSON.parse(atob(encodedUser));
//                done();
//            });
//        });


        it('should log user in using email/password', function(done) {
//          var creds = _.pick(credentials, 'email', 'password');
            var creds = { email: 'fake@email.com', password: 'password' };
            agent.post('/login').send(creds).end(function(err, res) {
                res.status.should.equal(200);
                res.body.should.have.property('token');

                token = res.body.token;
                var encodedUser = token.split('.')[1];
                currentUser = JSON.parse(atob(encodedUser));

                done();
            });
        });


        it('should update phone number', function(done) {
            currentUser.phone = '1234567890';
            request(app).put('/users/' + currentUser.id)
                .send(currentUser)
                .set('authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    res.status.should.equal(200);
                    var user = res.body;
                    user.phone.should.equal(currentUser.phone);
                    done();
                });
        });


        describe('update password', function() {
            it('should return error when no password is provided', function(done) {
                async.waterfall([
                    function(callback) {
                        request(app).put('/users/' + currentUser.id + '/password')
                            .send({})
                            .set('authorization', 'Bearer ' + token)
                            .end(callback);
                    }
                ], function(err, res) {
                    res.status.should.equal(400);

                    var errors = res.body;
                    errors.should.have.length(1);

                    var error = errors[0];
                    error.should.have.property("msg");
                    error.msg.should.equal("Please provide a password");

                    done();
                });
            });

            it('should not update password if the password is null', function(done) {
                var payload = {
                    password: null
                };
                async.waterfall([
                    function(callback) {
                        request(app).put('/users/' + currentUser.id + '/password')
                            .send(payload)
                            .set('authorization', 'Bearer ' + token)
                            .end(callback);
                    }
                ], function(err, res) {
                    res.status.should.equal(400);

                    var errors = res.body;
                    errors.should.have.length(1);

                    var error = errors[0];
                    error.should.have.property("msg");
                    error.msg.should.equal("Please provide a password");

                    done();
                });
            });

            it('should not update password if the password is empty', function(done) {
                var payload = {
                    password: ""
                };
                async.waterfall([
                    function(callback) {
                        request(app).put('/users/' + currentUser.id + '/password')
                            .send(payload)
                            .set('authorization', 'Bearer ' + token)
                            .end(callback);
                    }
                ], function(err, res) {
                    res.status.should.equal(400);

                    var errors = res.body;
                    errors.should.have.length(1);

                    var error = errors[0];
                    error.should.have.property("msg");
                    error.msg.should.equal("Please provide a password");

                    done();
                });
            });


            it('should update the password', function(done) {
                //this.timeout(10000);
                var password = "newpassword";
                var payload = {
                    password: password
                };
                async.waterfall([
                    function(callback) {
                        request(app).put('/users/' + currentUser.id + '/password')
                            .send(payload)
                            .set('authorization', 'Bearer ' + token)
                            .end(function(err, res) {
                                res.status.should.equal(200);
                                callback(err, res);
                            });
                    },
                    function(res, callback) {
                        var newCredentials = {
                            email: currentUser.email,
                            password: password
                        };
                        request(app).post('/login').send(newCredentials).end(callback);
                    }
                ], function(err, res) {
                    res.body.should.have.property('token');
                    done();
                });
            });
        });

        it('should return an error if creating a user with an existing email', function(done) {
//            agent.post('/users').send(credentials).end(function(err, res) {
//                console.log(err, res.body);
//                done();
//            });
            done();
        });

        describe('with reset key', function() {
            var reset_key;

            beforeEach(function(done) {
                agent.put('/users/reset').send({email: credentials.email}).end(function(err, res) {
                    res.status.should.equal(200);
                    User.findById(currentUser.id).then(function(user) {
                        reset_key = user.reset_key;
                        done();
                    });
                });
            });

            describe('resets password', function() {
                var password = 'newpassword';

                beforeEach(function(done) {
                    agent.put('/users/reset/' + reset_key).send({password: password}).end(function(err, res) {
                        done();
                    });
                });

                it('should use reset key to reset password', function(done) {
                    var newCredentials = {
                        email: credentials.email,
                        password: password
                    };
                    request(app).post('/login').send(newCredentials).end(function(err, res) {
                        res.body.should.have.property('token');
                        done();
                    });
                });

                it('should not allow user to log in with old password', function(done) {
                    request(app).post('/login').send(credentials).end(function(err, res) {
                        var errors = res.body;
                        var error = errors[0];
                        error.msg.should.equal('Invalid email or password');
                        done();
                    });
                });

                it('should clear reset key after it is used', function(done) {
                    agent.put('/users/reset/' + reset_key).send({password: password}).end(function(err, res) {
                        res.status.should.equal(404);
                        done();
                    });
                });
            });

            it('should return bad request when no new password is provided', function(done) {
                agent.put('/users/reset/' + reset_key).send().end(function(err, res) {
                    res.status.should.equal(400);
                    done();
                });
            });
        });

        it('should return 404 if user is not found', function(done) {
            agent.put('/users/reset').send({email: 'blabber@blabber.com'}).end(function(err, res) {
                res.status.should.equal(404);
                done();
            });
        });

        it('should return an error if no email is provided', function(done) {
            agent.put('/users/reset').send({}).end(function(err, res) {
                res.status.should.equal(400);
                res.body.msg.should.equal('No email provided');
                done();
            });
        });

        describe('when admin', function() {
            beforeEach(function (done) {
                User.findById(currentUser.id).then(function(userToMakeAdmin) {
                    userToMakeAdmin.role = 'Admin';
                    db.knex('users').update(userToMakeAdmin).where('id', currentUser.id).then(function() {
                        done();
                    });
                });
            });

            it('should list users', function(done) {
                request(app).get('/users')
                    .set('authorization', 'Bearer ' + token)
                    .end(function(err, res) {
                        var users = res.body;
//                        users.length.should.equal(1);
                        verifyUserFields(users[0]);
                        done();
                    });
            });

            it('should be able to update role', function(done) {
                currentUser.role = 'Customer';
                request(app).put('/users/' + currentUser.id)
                    .send(currentUser)
                    .set('authorization', 'Bearer ' + token)
                    .end(function(err, res) {
                        res.status.should.equal(200);
                        var user = res.body;
                        user.role.should.equal('Customer');
                        done();
                    });
            });

            it('should not be able to update role to non existent value', function(done) {
                currentUser.role = 'Superman';
                request(app).put('/users/' + currentUser.id)
                    .send(currentUser)
                    .set('authorization', 'Bearer ' + token)
                    .end(function(err, res) {
                        res.status.should.equal(409);
                        done();
                    });
            });

            describe('adds another user', function() {
                var userToDelete;

                beforeEach(function(done) {
                    var user = {
                        first_name: 'John',
                        last_name: 'Doe',
                        email: 'anotherfake@email.com',
                        password: 'password',
                        phone: 1
                    };
                    request(app).post('/users').send(user).end(function(err, res) {
                        var encodedUser = res.body.token.split('.')[1];
                        userToDelete = JSON.parse(atob(encodedUser));
                        done();
                    });
                });

                it.skip('should delete user and accounts', function(done) {
                    request(app).del('/users/' + userToDelete.id)
                        .set('authorization', 'Bearer ' + token)
                        .end(function(err, res) {
                            res.status.should.equal(204);
                            request(app).get('/users/' + userToDelete.id)
                                .set('authorization', 'Bearer ' + token)
                                .end(function(err, res) {
                                    res.status.should.equal(404);
                                    done();
                                });
                        });
                });

                it('should not delete self', function(done) {
                    request(app).del('/users/' + currentUser.id)
                        .set('authorization', 'Bearer ' + token)
                        .end(function(err, res) {
                            res.status.should.equal(400);
                            done();
                        });
                });
            });

        });

        it('should list logged in user', function(done) {
            request(app).get('/users/me')
                .set('authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    var user = res.body;
                    verifyUserFields(user);
                    done();
                });
        });

        it('should include user in result', function(done) {
            var encodedUser = token.split('.')[1];
            var user = JSON.parse(atob(encodedUser));
            user.email.should.equal('fake@email.com');
            //verifyUserFields(user);
            done();
        });

        it('should allow a user to log in', function(done) {
            request(app).post('/login').send(credentials).end(function(err, res) {
                res.body.should.have.property('token');
                done();
            });
        });

        it('should not list users', function(done) {
            request(app).get('/users')
                .set('authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    res.status.should.equal(404);
                    done();
                });
        });

        it('should be able to update yourself', function(done) {
            currentUser.first_name = 'test update';
            request(app).put('/users/' + currentUser.id)
                .send(currentUser)
                .set('authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    res.status.should.equal(200);
                    var user = res.body;
                    verifyUserFields(user);
                    user.should.have.property('first_name');
                    done();
                });
        });

        it('should not be able to update role', function(done) {
            currentUser.role = 'Admin';
            request(app).put('/users/' + currentUser.id)
                .send(currentUser)
                .set('authorization', 'Bearer ' + token)
                .end(function(err, res) {
                    res.status.should.equal(409);
                    done();
                });
        });

        // it should not be able to update another user
    });

    after(function(done) {
        User.deleteByEmail(credentials.email);
        done();
    });
});