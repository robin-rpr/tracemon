/**
 * Copyright 2014 - mcandela
 * Date: 25/11/14
 * Time: 14:49
 */

define([
    "tracemon.env.config",
    "tracemon.lib.jquery-amd",
    "tracemon.model.autonomousSystem",
    "tracemon.lib.parsePrefix",
    "tracemon.connector.short-name"

], function(config, $, AutonomousSystem, prefixUtils, ShortNameConnector) {

    var AsnLookupConnector = function (env) {
        var hosts, $this, lookups, shortNameConnector;

        hosts = {};
        lookups = {};
        $this = this;
        shortNameConnector = new ShortNameConnector(env);
        this.autonomousSystemsByAs = {};
        this.autonomousSystemsByPrefix = {};

        this.enrich = function (host, asData){
            var deferredCall = $.Deferred();
            var sameAs;

            sameAs = this._getSamePrefixAs(host.ip);


            if (sameAs) {
                $this._updateObject(host, sameAs);
                deferredCall.resolve(host);
            } else {

                if (asData){
                    $this._updateObject(host, $this._createAutonomousSystemObject(asData));
                    deferredCall.resolve(hosts);
                } else {

                    // console.log("[AS lookup] No local info for host", host);

                    if (hosts[host.ip]){
                        $this._updateObject(host, hosts[host.ip]);
                        deferredCall.resolve(hosts);
                    } else {
                        $this._getJSON(host.ip)
                            .done(function(data){

                                hosts[host.ip] = $this._translate(host.ip, data);
                                if (hosts[host.ip]){
                                    $this._updateObject(host, hosts[host.ip]);
                                }
                                deferredCall.resolve(hosts);
                            });
                    }
                }

            }
            
            return deferredCall.promise();
        };


        this._getJSON = function (resources) {
            if (!lookups[resources]) {

                lookups[resources] = $.ajax({
                    dataType: "jsonp",
                    cache: false,
                    url: env.dataApiAsAnnotation,
                    data: {
                        "resources": resources,
                        "resource": resources,
                        "max_related" : 50
                    }
                });

            }

            return lookups[resources];
        };


        this._translate = function (ip, data){
            var autonomousSystem, ases, lookups;

            // ases = data["ases"];
            // lookups = data["lookups"];
            autonomousSystem = null;


            // if (ases && lookups && lookups[ip] && ases[lookups[ip]]){
            if (data && data.data){
                autonomousSystem = this._createAutonomousSystemObject(data.data);
            }

            return autonomousSystem;
        };

        this._updateObject = function (host, asObj){
            host.setAutonomousSystem(asObj);
            env.utils.observer.publish("model.host:change", host);
        };

        this._getSamePrefixAs = function(ip){
            var encodedIp;

            encodedIp = prefixUtils.encodePrefix(ip);

            for (var prefix in this.autonomousSystemsByPrefix){
                if (encodedIp.indexOf(prefix) == 0){
                    console.log("same AS");
                    return this.autonomousSystemsByPrefix[prefix];
                }
            }

            return false;
        };


        this._createAutonomousSystemObjectRipestat = function(asnData){
            var autonomousSystemObj, asn, asItem;

            if (asnData && asnData.asns && asnData.asns[0]) {
                asItem = asnData.asns[0];
                asn = asItem["asn"];

                autonomousSystemObj = this.autonomousSystemsByAs[asn]; // Check if the object was already created

                if (!autonomousSystemObj) { // No, it wasn't
                    autonomousSystemObj = new AutonomousSystem(asn); // Create a new model object
                    autonomousSystemObj.owner = asItem["holder"];
                    autonomousSystemObj.announced = asnData["announced"];
                    autonomousSystemObj.extra = asnData["block"];
                    shortNameConnector.enrichShortName(autonomousSystemObj);
                    this.autonomousSystemsByAs[asn] = autonomousSystemObj; // Store it
                    env.utils.observer.publish("model.as:new", autonomousSystemObj);
                }
            }
            return autonomousSystemObj;

        };

        this._createAutonomousSystemObject = function(data){
            return this._createAutonomousSystemObjectRipestat(data);
        };

        this._createAutonomousSystemObjectAdHoc = function(asnData){
            var autonomousSystemObj, asn;

            asn = asnData.number;
            autonomousSystemObj = this.autonomousSystemsByAs[asn]; // Check if the object was already created

            if (!autonomousSystemObj) { // No, it wasn't
                autonomousSystemObj = new AutonomousSystem(asn); // Create a new model object
                autonomousSystemObj.owner = asnData["holder"];
                autonomousSystemObj.announced = asnData["announced"];
                autonomousSystemObj.extra = asnData["block"];
                shortNameConnector.enrichShortName(autonomousSystemObj);
                this.autonomousSystemsByAs[asn] = autonomousSystemObj; // Store it
                env.utils.observer.publish("model.as:new", autonomousSystemObj);
            }

            return autonomousSystemObj;

        };

    };

    return AsnLookupConnector;

});

