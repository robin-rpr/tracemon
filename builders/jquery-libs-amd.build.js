/**
 * This file contains the config for require.js. 
 * If you change the directory structure this needs to match.
 */

({
    baseUrl : "..",
    findNestedDependencies: true,
    preserveLicenseComments: false,
    wrap: {
        start: "define([\"tracemon.lib.jquery-libs\"],function(){return jQuery.noConflict(true)});",
    },
    include: [],
    paths:{},
    optimize: "uglify2",
    wrapShim: true,
    out: "../.tmp/libs/jquery-libs-amd.min.js"
})