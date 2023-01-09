/**
 * This file contains the config for require.js. 
 * If you change the directory structure this needs to match.
 */

({
    baseUrl : "..",
    findNestedDependencies: true,
    preserveLicenseComments: false,
    wrap: {
        start: "define([], function(){define.amd=false;",
        end: "});"
    },
    include: [
        "tracemon.lib.jquery",
        "tracemon.lib.jquery-ui",
        "tracemon.lib.jquery-ui.timepicker",
        "tracemon.lib.bootstrap",
        "tracemon.lib.bootstrap-circle-popover",
        "tracemon.lib.bootstrap-table",
        "tracemon.lib.bootstrap-slider",
        "tracemon.lib.range-slider",
        "tracemon.lib.bootstrap-select2"
    ],
    paths: {
        "tracemon.lib.jquery": ".tmp/libs/jquery/jquery-1.11.1.min",
        "tracemon.lib.jquery-ui": ".tmp/libs/jquery/jquery-ui.min",
        "tracemon.lib.jquery-ui.timepicker": ".tmp/libs/jquery/jquery-ui.timepicker",
        "tracemon.lib.bootstrap": ".tmp/libs/bootstrap/js/bootstrap.min",
        "tracemon.lib.bootstrap-circle-popover": ".tmp/libs/bootstrap-circle-popover",
        "tracemon.lib.bootstrap-slider": ".tmp/libs/bootstrap-slider/js/bootstrap-slider",
        "tracemon.lib.bootstrap-table": ".tmp/libs/bootstrap-table/bootstrap-table.min",
        "tracemon.lib.bootstrap-select2": ".tmp/libs/bootstrap-select2/js/bootstrap-select",
        "tracemon.lib.range-slider": ".tmp/libs/range-slider/js/ion.rangeSlider"
    },
    shim: {
        "tracemon.lib.jquery-ui.timepicker": {
            deps: ["tracemon.lib.jquery", "tracemon.lib.jquery-ui"]
        },
        "tracemon.lib.bootstrap": {
            deps: ["tracemon.lib.jquery"]
        },
        "tracemon.lib.bootstrap-circle-popover": {
            deps: ["tracemon.lib.bootstrap"]
        },
        "tracemon.lib.bootstrap-slider": {
            deps: ["tracemon.lib.bootstrap"]
        },
        "tracemon.lib.bootstrap-table": {
            deps: ["tracemon.lib.bootstrap"]
        },
        "tracemon.lib.range-slider": {
            deps: ["tracemon.lib.bootstrap"]
        },
        "tracemon.lib.bootstrap-select2": {
            deps: ["tracemon.lib.bootstrap"]
        }

    },
    optimize: "uglify2",
    wrapShim: false,
    generateSourceMaps: false,
    out: "../.tmp/libs/jquery-libs.min.js"
})