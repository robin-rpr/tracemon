// Load Web App JavaScript Dependencies/Plugins
define([
    "tracemon.env.utils",
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.controller.main"
], function(Utils, config, language, $, main){

    var Tracemon = function(instance){
        var env, instanceParams, queryParams, parentDom, styleDownloads, objectToBeEnriched, utils;

        /*
         * Access to the instance
         */
        instanceParams = instance.instanceParams;
        queryParams = instance.queryParams;
        parentDom = instance.domElement;
        utils = new Utils();

        /*
         * Init Dependency Injection Vector
         */

        // Force dev mode
        if (utils.getUrlParam("hackdev") == "true"){
            instanceParams.dev = true;
        }

        env = {
            "version": "1.0.0",
            "dev": instanceParams.dev,
            "widgetUrl": TRACEMON_WIDGET_URL + "dev/",
            "utils": utils,
            "autoStart": (instanceParams.autoStart != undefined) ? instanceParams.autoStart : config.autoStart,
            "dataApiResults": instanceParams.dataApiResults || config.dataAPIs.results,
            "dataApiMetadata": instanceParams.dataApiMetadata || config.dataAPIs.metadata,
            "dataApiAsAnnotation": instanceParams.dataApiAsAnnotation || config.dataAPIs.dataApiAsAnnotation,
            "dataApiReverseDns": instanceParams.dataApiReverseDns || config.dataAPIs.dataApiReverseDns,
            "dataApiGeolocation": instanceParams.dataApiGeolocation || config.dataAPIs.dataApiGeolocation,
            "shortAsNamesApi": instanceParams.shortAsNamesApi || config.dataAPIs.shortAsNamesApi,
            "persistHostApi": instanceParams.persistHostApi || config.dataAPIs.persistHostApi,
            "dataApiAsnNeighbours": instanceParams.dataApiAsnNeighbours || config.dataAPIs.dataApiAsnNeighbours,
            "streamingUrl": instanceParams.streamingHost || config.streamingUrl,
            "trackingKey": instanceParams.trackingKey || config.defaultTrackingKey,
            "viewName": instanceParams.view || config.defaultViewName,
            "aggregateIPv4": instanceParams.aggregateIPv4 || config.defaultAggregationIPv4,
            "aggregateIPv6": instanceParams.aggregateIPv6 || config.defaultAggregationIPv6,
            "maxNumberHops": instanceParams.maxNumberHops || config.maxNumberHops,
            "maximumTracerouteValiditySeconds": instanceParams.maximumTracerouteValiditySeconds || config.maximumTracerouteValiditySeconds,
            "onlyGraph": instanceParams.onlyGraph,
            "templatesLocation": instanceParams.templatesLocation || config.templatesLocation,
            "reproductionSpeed":  instanceParams.reproductionSpeed || config.reproductionSpeed,
            "labelLevel":  instanceParams.labelLevel || config.defaultLabelLevel,
            "peeringDb":  instanceParams.peeringDb || config.dataAPIs.peeringDb,
            "realTimeUpdate":  (instanceParams.realTimeUpdate != null) ? instanceParams.realTimeUpdate : config.realTimeUpdate,
            "onlyCore":  instanceParams.onlyCore,
            "preloadGeolocations": (instanceParams.preloadGeolocations != null) ? instanceParams.preloadGeolocations : config.preloadGeolocations,
            "bypassApiCache": instanceParams.bypassApiCache,
            "sendErrors": (instanceParams.sendErrors != null) ? instanceParams.sendErrors : config.sendErrors,
            "parentDom": $(parentDom),
            "queryParams": queryParams,

            // Defaults for internal env parameters
            "loadedMeasurements": {},
            "loadedSources": {},
            "finalQueryParams": {
                startDate: null,
                stopDate: null,
                sources: null,
                measurements: []
            },
            "metaData": {
                startDate: null,
                stopDate: null
            }
        };

        /*
         * Check if parent dom exists
         */
        if (!env.parentDom || env.parentDom.length == 0){
            throw "The DOM Element to be populated was not found or defined. Please define a valid DOM Element to be populated.";
        }

        /*
         * Check if stylesheets are loaded
         */
        if (!instanceParams.dev){
            styleDownloads = [
                window.atlas._widgets.tracemon.urls.view + "css/style-lib.min.css"
            ];
        } else {
            styleDownloads = [
                window.atlas._widgets.tracemon.urls.view + "css/style.css",
                window.atlas._widgets.tracemon.urls.libs + "jquery/jquery-ui.min.css",
                window.atlas._widgets.tracemon.urls.libs + "bootstrap/css/bootstrap.min.css",
                window.atlas._widgets.tracemon.urls.libs + "bootstrap/css/bootstrap-theme.min.css",
                window.atlas._widgets.tracemon.urls.libs + "bootstrap-table/bootstrap-table.min.css",
                window.atlas._widgets.tracemon.urls.libs + "bootstrap-slider/css/bootstrap-slider.css",
                window.atlas._widgets.tracemon.urls.libs + "bootstrap-select2/css/bootstrap-select.css",
                window.atlas._widgets.tracemon.urls.libs + "range-slider/css/ion.rangeSlider.css",
                // window.atlas._widgets.tracemon.urls.libs + "range-slider/css/ion.rangeSlider.skinFlat.css"
                window.atlas._widgets.tracemon.urls.libs + "range-slider/css/ion.rangeSlider.skinModern.css"
            ];

        }

        objectToBeEnriched = {};

        utils.loadStylesheets(styleDownloads, function(){
            var n, length, methodName, callbackReady;

            env.main = new main(env);

            if (env.autoStart){
                env.main.init();
            }

            function enrichMethod(methodName) {
                objectToBeEnriched[methodName] = function () {
                    return env.main[methodName].apply(env.main, arguments);
                }
            }

            for (n=0,length=env.main.exposedMethods.length; n<length; n++){
                methodName = env.main.exposedMethods[n];
                enrichMethod(methodName);
            }

            callbackReady = window.atlas._widgets.tracemon.instances.callback[parentDom];
            if (callbackReady){
                callbackReady(objectToBeEnriched);
            }
        });


        /**
         * A set of methods exposed outside
         */
        return objectToBeEnriched;
    };

    return Tracemon;
});

