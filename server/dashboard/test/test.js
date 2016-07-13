"use strict";

function waitFor(testFx, onReady, name, timeOutMillis) {
    var start = new Date().getTime(),
    condition = false,
    interval = setInterval(function() {
        if ( (new Date().getTime() - start < timeOutMillis) && !condition ) {
            condition = testFx();
        } else {
            if(!condition) {
                console.log(name + " timeout");
                phantom.exit(1);
            } else {
                clearInterval(interval);
                try {
                    onReady();
                } catch (e) {
                    console.log(e);
                    phantom.exit(100);
                }
            }
        }
    }, 100); //< repeat check every 100ms
};


var page = require('webpage').create();

// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function(msg) {
    console.log(msg);
};

function makeFun(selector) {
    return selector[1] ?
      function (selector) {
        var elems = Array.prototype.filter.call(
            document.querySelectorAll(selector[0]),function(x) {
            return x.textContent.indexOf(selector[1]) > -1;
        });
        return elems.length > 0;
      } : function (selector) {return document.body.querySelector(selector[0]) !== null};
}

function findObject(selector) {
    if (selector[1]) {
        var elems = Array.prototype.filter.call(
            document.querySelectorAll(selector[0]),function(x) {
            return x.textContent.indexOf(selector[1]) > -1;
        });
        return elems[0];
    }
    return document.body.querySelector(selector[0]);
}

function runTest(actions) {
    try {
        if (actions.length === 0) phantom.exit(0);
        var current = actions.shift();

        if (current[0] == 'wait')
            waitFor(function() {return page.evaluate(makeFun(current[1]), current[1]);},
                    function() { runTest(actions); },
                    current[1], current[2] ? current[2] : 1000);
        else if (current[0] == 'click') {
            page.evaluate(function(current, findObject) {
                var evObj = document.createEvent('Events');
                evObj.initEvent('click', true, false);
                findObject(current).dispatchEvent(evObj);
            }, current[1], findObject);
            runTest(actions);
        } else {
            console.log("Unknown action");
            phantom.exit(400);
        }
    } catch (e) {
        console.log(e);
        phantom.exit(100);
    }
}

page.open("http://localhost:4800", function(status){
    if (status !== "success") {
        console.log("Unable to access network");
        phantom.exit(1);
    } else {
        runTest([['wait', ['a[href="#/new"]']], ['click', ['a[href="#/new"]']],
            ['wait', ['button.btn', 'Run']], ['click', ['button.btn', 'Run']],
            ['wait', ['span.label', 'running'], 20000], ['wait', ['div.bs-complete.bs-selected'], 600000]]);
    }
});