//////////////////////////////////////////////////////////////////////////////////////
//
//  The MIT License (MIT)
//
//  Copyright (c) 2015-present, Dom Chen.
//  All rights reserved.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy of
//  this software and associated documentation files (the "Software"), to deal in the
//  Software without restriction, including without limitation the rights to use, copy,
//  modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
//  and to permit persons to whom the Software is furnished to do so, subject to the
//  following conditions:
//
//      The above copyright notice and this permission notice shall be included in all
//      copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
//  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//  PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
//  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
//  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
//////////////////////////////////////////////////////////////////////////////////////

var fork = require('child_process').fork;
var open = require('biased-opener');
var Config = require('node-inspector/lib/config');

var inspectorArgs = createConfig(process.argv.slice(2));

var forkOptions = {silent: true};
var inspector = fork(
    require.resolve('node-inspector/bin/inspector'),
    inspectorArgs,
    forkOptions
);

inspector.on('message', handleInspectorMessage);

function handleInspectorMessage(msg) {
    switch (msg.event) {
        case 'SERVER.LISTENING':
            var url = msg.address.url;
            console.log('Visit %s to start debugging.', url);
            // try to launch the URL in one of those browsers in the defined order
            // (but if one of them is default browser, then it takes priority)
            open(url, {
                preferredBrowsers: ['chrome', 'chromium', 'opera']
            }, function (err, okMsg) {
                if (err) {
                    // unable to launch one of preferred browsers for some reason
                    console.log(err.message);
                    console.log('Please open the URL manually in Chrome/Chromium/Opera or similar browser');
                }
            });
            break;
        case 'SERVER.ERROR':
            console.log('Cannot start the server: %s.', msg.error.code);
            process.exit(1);
            break;
    }
}

process.once('exit', function () {
    inspector.kill('SIGINT');
});


function createConfig(argv) {
    var options = new Config(argv, true);
    var length = argv.length;
    var hasDebugPort = false;
    for (var i = 0; i < length; i++) {
        if (argv[i].indexOf("--debug-port") != -1) {
            hasDebugPort = true;
            break;
        }
    }

    return [
        "--no-inject",
        "--debug-port=" + (hasDebugPort ? options.debugPort : "5959"),
        "--web-port=" + options.webPort
    ];
}
