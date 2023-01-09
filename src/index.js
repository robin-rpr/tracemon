/**
 * Customization, put your URL here
 */
TRACEMON_WIDGET_URL = ((typeof TRACEMON_EXTERNAL_WIDGET_URL == 'undefined') ? "" : TRACEMON_EXTERNAL_WIDGET_URL);

/**
 * Initialize Latencymon on Window
 */
window.atlas = window.atlas || {};
window.atlas._widgets = window.atlas._widgets || {};
window.atlas._widgets.tracemon = window.atlas._widgets.tracemon || {};
window.atlas._widgets.tracemon.urls = window.atlas._widgets.tracemon.urls || {
        libs: TRACEMON_WIDGET_URL + "libs/",
        env: TRACEMON_WIDGET_URL + "environment/",
        connector: TRACEMON_WIDGET_URL + "connector/",
        model: TRACEMON_WIDGET_URL + "model/",
        view: TRACEMON_WIDGET_URL + "view/",
        controller: TRACEMON_WIDGET_URL + "controller/",
        session: TRACEMON_WIDGET_URL + "session/"
    };
window.atlas._widgets.tracemon.instances = window.atlas._widgets.tracemon.instances || {
        requested: [],
        running: {},
        callback: {}
    };


if (!window.atlas._widgets.widgetInjectorRequested) { // Only one injector
    window.atlas._widgets.widgetInjectorLoaded = false;
    window.atlas._widgets.widgetInjectorRequested = true;
    window.atlas._widgets.tracemon.tmp_scripts = document.getElementsByTagName('script');
    window.atlas._widgets.tracemon.tmp_scrip = window.atlas._widgets.tracemon.tmp_scripts[window.atlas._widgets.tracemon.tmp_scripts.length - 1];
    window.atlas._widgets.injectorScript = document.createElement('script');
    window.atlas._widgets.injectorScript.async = false;
    window.atlas._widgets.injectorScript.src = window.atlas._widgets.tracemon.urls.libs + 'require.min.js';
    window.atlas._widgets.tracemon.tmp_scrip.parentNode.appendChild(window.atlas._widgets.injectorScript);
}

function initTracemon(domElement, instanceParams, queryParams){
    var run;

    run = function(){
        var instances, instance;

        instances = window.atlas._widgets.tracemon.instances;
        instance = instances.requested.shift();

        while (instance){

            (function(instances, instance){
                if (instance.instanceParams.dev) { 
                    // Load dev version
                    require([TRACEMON_WIDGET_URL + 'tracemon.js'], function(Tracemon){
                        instances.running[instance.domElement] = Tracemon(instance);
                    });
                } else {
                    // Load production version
                    require([TRACEMON_WIDGET_URL + 'tracemon.min.js'], function () {
                        require(['tracemon'], function(Tracemon){
                            instances.running[instance.domElement] = Tracemon(instance);
                        });
                    });
                }
            })(instances, instance);

            instance = instances.requested.shift();
        }
    };

    window.atlas._widgets.tracemon.instances.callback[domElement] = null;
    window.atlas._widgets.tracemon.instances.requested
        .push({domElement: domElement, instanceParams: instanceParams, queryParams: queryParams, callbacks: {}});

    if (document.readyState == 'complete'){
        window.atlas._widgets.widgetInjectorLoaded = true;
    } else {

        function ieLoadBugFix(){
            if (!window.atlas._widgets.widgetInjectorLoaded){
                if (document.readyState=='loaded' || document.readyState=='complete') {
                        window.atlas._widgets.injectorScript.onload();
                }else {
                    setTimeout(ieLoadBugFix, 200);
                }
            }
        }

        ieLoadBugFix();
    }

    if (window.atlas._widgets.widgetInjectorLoaded === false){
        window.atlas._widgets.injectorScript.onload = function(){
            window.atlas._widgets.widgetInjectorLoaded = true;
            run();
        };
    } else {
        run();
    }

    return {
        ready: function(callback){
            window.atlas._widgets.tracemon.instances.callback[domElement] = callback;
        },
        shell: function(){
            var instance = window.atlas._widgets.tracemon.instances.running[domElement];

            if (instance) {
                return instance;
            } else {
                throw "Loading, try again in a few seconds..."
            }
        }
    };
}
