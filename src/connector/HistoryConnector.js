/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "tracemon.env.config",
    "tracemon.lib.jquery-amd"
], function(config, $) {

    var HistoryConnector = function (env) {
        var hostsResolutionByIp, anycastIndexQuery, geolocByIp, neighboursByAsn, probesInfo, measurementInfo,
            callsBundler, anycastIndex, anycastIndexed, locating;


        hostsResolutionByIp = {};
        geolocByIp = {};
        neighboursByAsn = {};
        probesInfo = {};
        locating = {};
        measurementInfo = {};
        anycastIndex = {};
        anycastIndexed = false;
        callsBundler = {
            queries: {},
            timer: null
        };

        this.getMeasurementResults = function (measurementId, options) {
            var queryParams;

            if (!options.startDate || !options.stopDate){
                throw 400;
            }

            queryParams = {
                start: options.startDate.unix(),
                stop: options.stopDate.unix(),
                include: []
            };

            if (env.preloadGeolocations){
                queryParams.include.push("geo");
            }

            if (env.bypassApiCache){
                queryParams.force = 1;
            }

            if (options.sources) {
                queryParams.probe_ids = options.sources.join(',');
            }

            queryParams.include = queryParams.include.join(",");

            return $.ajax({
                dataType: "jsonp",
                async: true,
                cache: false,
                timeout: config.resultTimeout,
                url: env.dataApiResults.replace("0000", measurementId),
                data: queryParams,
                error: function () {
                    env.utils.observer.publish("error", {
                        type: 408,
                        message: config.errors[408]
                    });
                }
            });
        };

        this.getMeasurementInfo = function (measurementId){

            if (!measurementInfo[measurementId]){
                measurementInfo[measurementId] =  $.ajax({
                    type: 'GET',
                    async: true,
                    dataType: "jsonp",
                    cache: false,
                    timeout: config.ajaxTimeout,
                    url: env.dataApiMetadata.replace("0000", measurementId),
                    error: function () {
                        env.utils.observer.publish("error", {
                            type: 408,
                            message: config.errors[408]
                        });
                    }
                });
            }

            return measurementInfo[measurementId];
        };

        this.getHostReverseDns = function (ip) {

            if (!hostsResolutionByIp[ip]) {
                hostsResolutionByIp[ip] = $.ajax({
                    dataType: "jsonp",
                    cache: false,
                    async: true,
                    timeout: config.ajaxTimeout,
                    url: env.dataApiReverseDns,
                    data: {
                        resource: ip
                    },
                    error: function () {
                        env.utils.observer.publish("error", {
                            type: 408,
                            message: config.errors[408]
                        });
                    }
                });
            }

            return hostsResolutionByIp[ip];
        };

        this.isAnycast = function (ip) {
            var deferredCall = $.Deferred();
            if (!anycastIndexed) {
                this.getAnycastIndex()
                    .then(function (index) {
                        if (index && index.anycast) {
                            for (var n = 0, length = index.anycast.length; n < length; n++) {
                                anycastIndex[index.anycast[n]] = true;
                            }
                        }
                        anycastIndexed = true;
                        deferredCall.resolve(anycastIndex[ip] || false);
                    })
                    .fail(function(){
                        deferredCall.resolve(false);
                    })
            } else {
                deferredCall.resolve(anycastIndex[ip] || false);
            }

            return deferredCall.promise();
        };

        this.getAnycastIndex = function () {
            if (!anycastIndexQuery) {
                anycastIndexQuery = $.ajax({
                    dataType: "json",
                    cache: false,
                    async: true,
                    timeout: config.ajaxTimeout,
                    url: config.dataAPIs.anycastIndex,
                    data: {},
                    error: function () {
                        env.utils.observer.publish("error", {
                            type: 408,
                            message: config.errors[408]
                        });
                    }
                });
            }

            return anycastIndexQuery;
        };

        this.getGeolocation = function (ip, force, body) {
            var deferredCall, realCall;

            realCall = function(queries){
                var ips = Object.keys(queries);

                $.ajax({
                    cache: false,
                    method: 'POST', //(body ? "POST" : "GET") ,
                    async: true,
                    timeout: config.ajaxTimeout,
                    url: env.dataApiGeolocation + '?resources=' + ips.join(",") + '&trackingKey=' + env.trackingKey,
                    contentType: "application/json; charset=utf-8",
                    dataType: (body ? "json" : "jsonp"),
                    data: body,
                    error: function () {
                        env.utils.observer.publish("error", {
                            type: "408",
                            message: config.errors["408"]
                        });
                    }
                })
                    .done(function(locations) {
                        if (locations.metadata && locations.metadata.service && locations.metadata.service.contributions) {
                            for (var ipContrib in locations.metadata.service.contributions){
                                var contributingEngines = locations.metadata.service.contributions[ipContrib];

                                for(var engine in Object.keys(contributingEngines)) {
                                    locating[ipContrib] = engine.metadata && engine.metadata.locating == true;
                                }
                            }
                        }
                        if (locations.data) {
                            ips.forEach(function (ip) {
                                var geolocation = locations.data[ip];
                                if (locating[ip]) {
                                    geolocation = geolocation || {};
                                    geolocation.locating = true;
                                }
                                queries[ip].resolve(geolocation);
                            });
                        }

                    });
            };

            if (force || !geolocByIp[ip]) {
                deferredCall = $.Deferred();
                geolocByIp[ip] = deferredCall.promise();

                if (body){

                    var singleCall = {};
                    singleCall[ip] = deferredCall;
                    realCall(singleCall);

                } else {

                    callsBundler.queries[ip] = deferredCall;
                    clearTimeout(callsBundler.timer);

                    if (Object.keys(callsBundler.queries).length < config.maxBundledQueries) {
                        callsBundler.timer = setTimeout(function () {
                            realCall(callsBundler.queries);
                            callsBundler.queries = {};
                        }, config.queryGroupingAntiFlood);
                    } else {
                        realCall(callsBundler.queries);
                        callsBundler.queries = {};
                    }

                }

            }
            return geolocByIp[ip];
        };

        this.getNeighbours = function (asn) {

            if (!neighboursByAsn[asn]) {
                neighboursByAsn[asn] = $.ajax({
                    dataType: "jsonp",
                    cache: false,
                    async: true,
                    timeout: config.ajaxTimeout,
                    url: env.dataApiAsnNeighbours,
                    data: {
                        resource: asn
                    },
                    error: function () {
                        env.utils.observer.publish("error", {
                            type: "408",
                            message: config.errors["408"]
                        });
                    }
                });
            }

            return neighboursByAsn[asn];
        };

        this.getProbesInfo = function(measurementId){

            if (measurementInfo[measurementId]){
                return measurementInfo[measurementId]; // It's the same API, it may change in the future
            }

            if (!probesInfo[measurementId]){
                probesInfo[measurementId] = $.ajax({
                    dataType: "jsonp",
                    cache: false,
                    async: true,
                    timeout: config.ajaxTimeout,
                    url: env.dataApiMetadata.replace("0000", measurementId),
                    data: {
                        type: "jsonp"
                    },
                    error: function () {
                        env.utils.observer.publish("error", {
                            type: 408,
                            message: config.errors[408]
                        });
                    }
                });

            }

            return probesInfo[measurementId];
        };


    };

    return HistoryConnector;

});

