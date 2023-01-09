({
    baseUrl : "../.tmp",
    findNestedDependencies: true,
    preserveLicenseComments: false,
    name: 'tracemon',
    paths:{
        /* Environment Paths */
        "tracemon.env": "environment/environment",
        "tracemon.env.utils": "environment/utils",
        "tracemon.env.config": "environment/config",
        "tracemon.env.params-manager": "environment/ParamsManager",
        "tracemon.env.history-manager": "environment/HistoryManager",
        "tracemon.env.languages.en": "environment/languages/language.eng",
        "tracemon.env.latencymon-adapter": "environment/latencyMonAdapter",
        /* Lib Paths */
        "tracemon.lib.jquery": "libs/jquery/jquery-1.11.1.min",
        "tracemon.lib.jquery-ui": "libs/jquery/jquery-ui.min",
        "tracemon.lib.tree-map": "libs/TreeMap",
        "tracemon.lib.date-format": "libs/dateFormat",
        "tracemon.lib.bootstrap": "libs/bootstrap/js/bootstrap.min",
        "tracemon.lib.bootstrap-slider": "libs/bootstrap-slider/js/bootstrap-slider",
        "tracemon.lib.bootstrap-select": "libs/bootstrap-select/js/bootstrap-select",
        "tracemon.lib.socket-io": "libs/socket.io",
        "tracemon.lib.bootstrap-table": "libs/bootstrap-table/bootstrap-table.min",
        "tracemon.lib.jquery-amd": "libs/jquery-libs-amd.min",
        "tracemon.lib.jquery-libs": "libs/jquery-libs.min",
        "tracemon.lib.ip": "libs/ip",
        "tracemon.lib.parsePrefix": "libs/parsePrefix",
        "tracemon.lib.dagre-d3": "libs/dagre-d3",
        "tracemon.lib.dagre": "libs/dagre",
        "tracemon.lib.mustache": "libs/mustache",
        "tracemon.lib.handlebars": "libs/handlebars",
        "tracemon.lib.text": "libs/require-text",
        "tracemon.lib.stache": "libs/stache",
        "tracemon.lib.d3-amd": "libs/d3/js/d3.v3.amd",
        "tracemon.lib.d3-magnetic-cursor": "libs/d3-magnetic-cursor",
        "tracemon.lib.range-slider": "libs/range-slider/js/ion.rangeSlider",
        "tracemon.lib.reparse": "libs/reparse",
        "tracemon.lib.expression": "libs/expression",
        "tracemon.lib.moment": "libs/moment",
        "tracemon.lib.viz": "libs/graphviz-amd",
        "tracemon.lib.graphViz": "libs/viz",
        /* View Paths */
        "tracemon.view.main": "view/MainView",
        "tracemon.view.as-view": "view/ASView",
        "tracemon.view.location-view": "view/LocationView",
        "tracemon.view.label-placement": "view/LabelPlacementHelper",
        "tracemon.view.viewport": "view/ViewPort",
        "tracemon.view.chartManager": "view/ChartManager",
        "tracemon.view.templateManager": "view/TemplateManagerView",
        "tracemon.view.timeOverview": "view/TimeOverviewView",
        "tracemon.view.dagre-wrapper": "view/layout/DagreWrapper",
        "tracemon.view.graphviz-wrapper": "view/layout/GraphvizWrapper",
        "tracemon.view.svg.chart": "view/svg/SvgChartView",
        /* View Paths for Single Host View Mode */
        "tracemon.view.single-host.single-host-view": "view/single-host/SingleHostView",
        "tracemon.view.single-host.path-view": "view/single-host/PathView",
        "tracemon.view.single-host.node-view": "view/single-host/NodeView",
        "tracemon.view.single-host.label-view": "view/single-host/LabelView",
        "tracemon.view.single-host.edge-view": "view/single-host/EdgeView",
        /* Model Paths */
        "tracemon.model.host": "model/Host",
        "tracemon.model.autonomousSystem": "model/AutonomousSystem",
        "tracemon.model.hop": "model/Hop",
        "tracemon.model.measurement": "model/Measurement",
        "tracemon.model.traceroute": "model/Traceroute",
        "tracemon.model.attempt": "model/Attempt",
        /* Controller Paths */
        "tracemon.controller.gesture-manager": "controller/GesturesManager",
        "tracemon.controller.url-manager": "controller/UrlManager",
        "tracemon.controller.main": "controller/main",
        "tracemon.controller.history-manager": "controller/HistoryManager",
        "tracemon.controller.header": "controller/HeaderController",
        "tracemon.controller.boolean-search": "controller/BooleanSearchHelper",
        "tracemon.controller.source-selection": "controller/SourcesSelectionHelper",
        /* Connector Paths */
        "tracemon.connector.facade": "connector/ConnectorFacade",
        "tracemon.connector.history": "connector/HistoryConnector",
        "tracemon.connector.translation": "connector/TranslationConnector",
        "tracemon.connector.live": "connector/LiveConnector",
        "tracemon.connector.peering-db": "connector/PeeringDbConnector",
        "tracemon.connector.host-helper": "connector/HostClassificationHelper",
        "tracemon.connector.asn": "connector/AsnLookupConnector",
        "tracemon.connector.short-name": "connector/ShortNameConnector",
        "tracemon.connector.persist-host": "connector/PersistHostConnector",
        "tracemon.connector.log.persist": "connector/log/LogRestConnector",
        "tracemon.connector.ripe-database": "connector/RipeDatabaseConnector",
        "tracemon.connector.cache": "connector/CacheConnector",
    },
    shim:{
        "tracemon.lib.d3-magnetic-cursor": {
            deps: ["tracemon.lib.d3-amd"]
        },
        "tracemon.lib.socket-io": {
            exports: "io"
        },
        "tracemon.lib.jquery.cookie": {
            deps: ["tracemon.lib.jquery"]
        },
        "tracemon.lib.jquery-ui.timepicker": {
            deps: ["tracemon.lib.jquery-ui"]
        },
        "tracemon.lib.dagre-d3": {
            deps: ["tracemon.lib.d3-amd"],
            exports: 'dagreD3'
        },
        "tracemon.lib.dagre": {
            exports: 'dagre'
        },
        "tracemon.lib.jquery-amd": {
            deps: ["tracemon.lib.moment"]
        }
    },
    stache: {
        extension: '.html', // default = '.html'
        path: 'view/html/' // default = ''
    },
    removeCombined: true,
    optimize: "uglify2",
    wrapShim: false,
    generateSourceMaps: false,
    out: "../.tmp/tracemon.min.js"
})