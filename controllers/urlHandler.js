'use strict';

var Counters = require('../models/counters.js');
var UrlEntries = require('../models/urlEntries.js');
var dns = require('dns');



function getCountAndIncrease(req, res, callback) {
    Counters
        .findOneAndUpdate({}, { $inc: { 'count': 1 } }, function (err, data) {
            if (err) return;
            if (data) {
                callback(data.count);
            } else {
                var newCounter = new Counters();
                newCounter
                    .save(function (err) {
                        if (err) return;
                        Counters
                            .findOneAndUpdate({}, { $inc: { 'count': 1 } }, function (err, data) {
                                if (err) return;
                                callback(data.count);
                            });
                    });
            }
        });
}



// Regex para ver si tiene http o https
var protocolRegExp = /^https?:\/\/(.*)/i;

// Regex para patrones del estilo xxxx.xxxx.xxxx.
var hostnameRegExp = /^([a-z0-9\-_]+\.)+[a-z0-9\-_]+/i;


exports.addUrl = function (req, res) {
    console.log(req);
    var url = req.body.url;

    var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
    var regex = new RegExp(expression); 

    var urlType = url.match(regex);
    if(!urlType) {
        return res.json({ "error": "invalid URL" });
    }

    // "www.example.com/test/" and "www.example.com/test" are the same URL
    if (url.match(/\/$/i))
        url = url.slice(0, -1);

    var protocolMatch = url.match(protocolRegExp);
    if (!protocolMatch) {
        return res.json({ "error": "invalid URL" });
    }

    // remove temporarily the protocol, for dns lookup
    var hostAndQuery = protocolMatch[1];

    // Here we have a URL w/out protocol
    // DNS lookup: validate hostname
    var hostnameMatch = hostAndQuery.match(hostnameRegExp);
    if (hostnameMatch) {
        // the URL has a valid www.whaterver.com[/something-optional] format
        dns.lookup(hostnameMatch[0], function (err) {
            if (err) {
                // no DNS match, invalid Hostname, the URL won't be stored
                res.json({ "error": "invalid Hostname" });
            } else {
                // URL is OK, check if it's already stored
                UrlEntries
                    .findOne({ "url": url }, function (err, storedUrl) {
                        if (err) return;
                        if (storedUrl) {
                            // URL is already in the DB, return the matched one
                            res.json({ "original_url": url, "short_url": storedUrl.index });
                        } else {
                            // Increase Counter and store the new URL,
                            getCountAndIncrease(req, res, function (cnt) {
                                var newUrlEntry = new UrlEntries({
                                    'url': url,
                                    'index': cnt
                                });
                                // then return the stored data.
                                newUrlEntry
                                    .save(function (err) {
                                        if (err) return;
                                        res.json({ "original_url": url, "short_url": cnt });
                                    });
                            });
                        }
                    });
            }
        });
    } else {
        // the URL has not a www.whatever.com format
        res.json({ "error": "invalid URL" });
    }
    
};


exports.processUrl = function (req, res) {
    var shorturl = req.params.shorturl;
    if (!parseInt(shorturl, 10)) {
        // The short URL identifier is not a number
        res.json({ "error": "Wrong url" });
        return;
    }
    
    UrlEntries
        .findOne({ "index": shorturl }, function (err, data) {
            if (err) return;
            if (data) {
                // redirect to the stored page
                res.redirect(data.url);
            } else {
                res.json({ "error": "id not found" });
            }
        });
        
        
        

};

exports.cleanAll = function (req, res) {
    UrlEntries.remove({}, function (err, count) {
        if(err) res.json({"error": "fuck u "});
        res.json({ "Num of elements": count.result.n });
    });
    
};

exports.fillOne = function (req, res) {
    var urlEntry1 = new UrlEntries({
        url: 'http://www.google.es',
        index: 1
    });
    
    urlEntry1.save(function (err) {
        if (err) return handleError(err);
    });

    res.json({ "New element": "Added new element" });
};

exports.getLastPosition = function (req, res) {
    var elem = "";
    Counters.find({}, function (err, counters) {
        counters.forEach(function (elemento) {
            elem = elemento;
        });
        if(err) return res.json({"ERROR":"FU"});
        var valorPrevio = elem.count;
        elem.count = elem.count+1;
        elem.save();

        res.json({"LAST POSITION": "HAD " + valorPrevio + " AND NOW " + elem.count});
    });

}