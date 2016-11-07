// imap mail getter thing
// https://github.com/mscdex/node-imap
// v2 - gets raw body

var Imap = require('imap'),
    inspect = require('util').inspect;

// TODO: relocate email params to config


var imap = null;

function getNewImap() {
    
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
            if (err) throw err;
            //var f = imap.seq.fetch('*', { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'] }); // box.messages.total + ':*'
            var f = imap.seq.fetch('*', { bodies: ['HEADER', 'TEXT'] }); // full header
            //var f = imap.seq.fetch('*', { bodies: '' }); // get everything
            
            f.on('message', function (msg, seqno) {
                console.log('Message #%d', seqno);
                var prefix = '(#' + seqno + ') ';
                msg.on('body', function (stream, info) {
                    if (info.which === 'TEXT')
                        console.log(prefix + 'Body [%s] found, %d total bytes', inspect(info.which), info.size);
                    var buffer = '', count = 0;
                    stream.on('data', function (chunk) {
                        count += chunk.length;
                        buffer += chunk.toString('utf8');
                        if (info.which === 'TEXT')
                            console.log(prefix + 'Body [%s] (%d/%d)', inspect(info.which), count, info.size);
                    });
                    stream.once('end', function () {
                        if (info.which !== 'TEXT') {
                            console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
                        }
                        else {
                            console.log(prefix + 'Body [%s] Finished', inspect(info.which));
                            console.log('--- Raw Body --------------\n' + buffer.slice(0,900) + '\n--- Raw Body --------------\n');
                        }
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
                console.log('Fetch error: ' + err);
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

