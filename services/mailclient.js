// imap mail getter thing
// https://github.com/mscdex/node-imap

var Imap = require('imap'),
    inspect = require('util').inspect;


var imap = null;

function getNewImap()  {
    
    // secure (TLS) - requires good cert?
    /*imap = new Imap({
        user: 'testcatcher@isotope.ca',
        password: 'f41thfu1?',
        host: 'cpanel1.njh.ca',
        port: 993,
        tls: true
    });*/
    
    // insecure, but works...
    imap = new Imap({
        user: 'testcatcher@isotope.ca',
        password: 'f41thfu1?',
        host: 'mail.isotope.ca',
        port: 143,
        tls: false
    });

    imap.once('ready', function () {
        console.log('imap ready');
        openInbox(function (err, box) {
            console.log('inside openInbox');
            if (err) throw err;
            var f = imap.seq.fetch('*', {
                bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
                struct: true
            });
            f.on('message', function (msg, seqno) {
                console.log('Message #%d', seqno);
                var prefix = '(#' + seqno + ') ';
                msg.on('body', function (stream, info) {
                    var buffer = '';
                    stream.on('data', function (chunk) {
                        buffer += chunk.toString('utf8');
                    });
                    stream.once('end', function () {
                        console.log(prefix + 'Parsed header: %s',buffer);
                    });
                });
                msg.once('attributes', function (attrs) {
                    console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
                });
                msg.once('end', function () {
                    console.log(prefix + 'Finished');
                });
            });
            f.once('error', function (err) {
                console.log('Fetch error: ' + err + ' ... closing connection');
                imap.end(); //added kn
            });
            f.once('end', function () {
                console.log('Done fetching all messages!');
                imap.end();
            });
        });
    });
    
    imap.once('error', function (err) {
        console.log(err);
    });
    
    imap.once('end', function () {
        console.log('Connection ended');
    });
}

exports.emailTest = function () {
    console.log('actual emailtest function');
    getNewImap();
    imap.connect();
    //imap.openBox('INBOX', true);
    //imap.end();
    //imap.end();
    //imap = null;
    return "emailtest done";
};

function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
}




//imap.connect();

