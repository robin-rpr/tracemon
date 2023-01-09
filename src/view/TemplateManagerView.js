/**
 * Created by mcandela on 05/11/13.
 */

define([
    "tracemon.env.config",
    "tracemon.env.languages.en",
    "tracemon.lib.jquery-amd",
    "tracemon.lib.moment",
    "tracemon.lib.d3-amd",
    "tracemon.controller.header",
    "tracemon.lib.stache!main",
    "tracemon.lib.stache!search",
    "tracemon.lib.stache!select-view",
    "tracemon.lib.stache!probes-selection",
    "tracemon.lib.stache!host-popover",
    "tracemon.lib.stache!modal-show-contacts",
    "tracemon.lib.stache!modal-update-location",
    "tracemon.lib.stache!modal-raw-traceroute"
], function(config, lang, $, moment, d3, HeaderController, template, search, selectView, probesSelection,
            hostPopover, modalContacts, modalLocation, modalTraceroute){
    
    
    /**
     * TemplateManagerView is the component in charge of creating and manipulating the HTML dom elements.
     *
     * @class TemplateManagerView
     * @constructor
     * @module view
     */

    var TemplateManagerView = function(env){
        var $this, lineFunction, blockListeners, headerController;

        $this = this;
        this.lang = lang;
        this.env = env;
        this.values = {};
        this.dom = {
            playerButtons: {},
            labelRadio: null,
            errorMessage: null,
            loadingImage: null,
            annotation: null,
            graphContainer: null
        };
        blockListeners = false;
        lineFunction = d3.svg.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .interpolate("linear");

        this.selectionDataset = {
            outcome: {
                text:'Outcome',
                order: 2,
                children: [
                    {id: 'outcomereached', text: 'Target reached'},
                    {id: 'outcomenot-reached', text: 'Target not reached '}
                ]
            }
        };

        this._removeAnnotations = function(which){
            which = which || env.parentDom.find(".annotation-tooltip.left, .annotation-tooltip.right"); // A specific one or all of them
            $(which)
                .fadeOut(config.transitionsTimes.annotationRemoval, function() {
                    $(this).remove();
                });
        };

        this.addAnnotation = function(nodeView){
            var left, annotationDom, annotationSizes, arrowMargin;

            left = (env.parentDom.width()/2 < nodeView.x);
            annotationDom = $this.dom.annotation.clone(false);
            annotationDom.appendTo($this.dom.graphContainer);
            arrowMargin = {
                x: 4 * (left ? 1 : -1),
                y: -4
            };
            annotationSizes = {
                width: annotationDom.outerWidth() * (left ? 0 : -1),
                height: annotationDom.outerHeight()/2
            };
            annotationDom
                .css({
                    top: (nodeView.y + annotationSizes.height + arrowMargin.y) + "px",
                    left: (nodeView.x + annotationSizes.width + arrowMargin.x) + "px",
                    display: "block"
                })
                .addClass(left ? "left" : "right");

            annotationDom
                .find(".annotation-tooltip-content")
                .text(nodeView.getAnnotation());

            if (env.emulationRunning) {
                setTimeout(function () {
                    $this._removeAnnotations(annotationDom);
                }, config.transitionsTimes.annotationDelay);
            }
        };


        this.setListeners = function(){
            env.utils.observer.subscribe("view.status:change", this.updateTemplatesInfo, this);

            env.utils.observer.subscribe("model.history:new", function(){
                this.updateTimeline();
                this.updateSearchBox();
            }, this);
            env.utils.observer.subscribe("model.history:change", this.updateTimeline, this);
            env.utils.observer.subscribe("view.time-selection:change", this.updateTimeline, this);
            env.utils.observer.subscribe("view.traceroute:click", function(traceroute){
                this.showModal("show-traceroute", traceroute);
            }, this);
            env.utils.observer.subscribe("view.animation:start", this._updatePlayerButtons, this);
            env.utils.observer.subscribe("view.animation:stop", this._updatePlayerButtons, this);
            env.utils.observer.subscribe("loading", this.showLoading, this);
            env.utils.observer.subscribe("error", function(error){
                this.showMessage(true, error.message, { timeout: config.messageTimeout, error: true });
            }, this);
        };

        this._updatePlayerButtons = function () {
            if (env.emulationRunning){
                this.dom.playerButtons.play.hide();
                this.dom.playerButtons.pause.show();
            } else {
                this.dom.playerButtons.play.show();
                this.dom.playerButtons.pause.hide();
            }
        };

        this.getSelectionDataset = function(){
            var out = [];

            this.selectionDataset.source = {
                text: 'Source',
                order: 1,
                children: $.map(env.finalQueryParams.sources, function (probeId) {
                    return {id: 'source' + probeId, text: 'Probe ' + probeId};
                })
            };

            this.selectionDataset.as = {
                text: 'ASN',
                order: 2,
                children: $.map(env.connector.getASes(), function (asObj) {
                    return {
                        id: 'as' + asObj.number,
                        label: 'AS' + asObj.number,
                        text: 'AS' + asObj.number + " - " + asObj.holder
                    };
                })
            };

            for (var part in this.selectionDataset){
                out.push(this.selectionDataset[part]);
            }

            return out;
        };

        this.updateTemplatesInfo = function(){
            if (!blockListeners && !env.onlyGraph) {
                this.values.target = this.getMonitoredTargets();
                this.values.totalProbes = Object.keys(env.loadedSources).length;
                this.values.numberProbes = env.finalQueryParams.sources.length;
                this.values.probes = env.finalQueryParams.sources;

                env.parentDom
                    .find('.hops-number-slider')
                    .bootstrapSlider('setAttribute', 'max', this.maxPossibleHops())
                    .bootstrapSlider('setValue', this.getNumberHops());

                env.parentDom.find('.hops-number .value-slider')
                    .text(this.getNumberHops());

                env.parentDom.find('.value-target').text(this.values.target);
                env.parentDom.find('.value-number-probes').text(this.values.numberProbes);
                env.parentDom.find('.value-total-probes').text(this.values.totalProbes);
                env.parentDom.find('.current-instant').text(env.finalQueryParams.instant.format('MMMM Do YYYY, HH:mm:ss') + ' UTC');

                this.dom.labelRadio
                    .each(function () {
                        $(this).prop("checked", $(this).val() == env.labelLevel);
                    });

            }
        };

        this.updateSearchBox = function(empty){
            var searchConfig;

            searchConfig = {
                dropdownParent: env.parentDom,
                debug: false,
                tags: "true",
                placeholder: "Focus on",
                allowClear: true,
                templateSelection: function (item) {
                    return item.label || item.text;
                }
            };

            if (!empty){
                searchConfig.data = this.getSelectionDataset();
            }

            if (this.searchField){
                this.searchField.select2("destroy").empty();
            }

            this.searchField = env.parentDom
                .find(".search-box-field")
                .select2(searchConfig)
                .on("change", function (value) {
                    headerController.search($(this).val());
                })
                .trigger('change.select2');


        };

        this.getMonitoredTargets = function () {
            var targets = [];

            for (var msmKey in env.loadedMeasurements){
                targets.push(env.loadedMeasurements[msmKey].target.name || env.loadedMeasurements[msmKey].target.ip);
            }

            return targets.join(",");
        };

        this.getNumberHops = function () {
            return Math.min(this.maxPossibleHops(), env.maxNumberHops);
        };

        this.maxPossibleHops = function(){
            return (env.metaData.longestTraceroute) ? env.metaData.longestTraceroute.getLength() : 0;
        };

        // This method is used by the mustache template
        this.getViews = function(){
            return Object.keys(lang.views)
                .map(function(key) {
                    return lang.views[key];
                })
        };

        // This method is used by the mustache template
        this.getViewLabel = function () {
            return lang.views[env.viewName];
        };

        this._updateSetOfProbes = function (probeSet) {
            if (probeSet.length <= config.maxAllowedSources){
                env.main.setSelectedSources(probeSet);
            } else {
                env.main.setSelectedSources(probeSet.slice(0, config.maxAllowedSources));
                env.utils.observer.publish("error", {
                    type: 697,
                    message: config.errors[697]
                });
            }
        };

        this.populateProbeList = function(data){
            var table, parent;

            parent = env.parentDom.find(".add-probe-panel");
            parent.show();
            table = parent.find('.probe-list');


            if (table.is(".table-condensed")) {
                table.bootstrapTable('load', data)
            } else {

                parent
                    .find(".close-panel")
                    .on("mouseup", function () {
                        parent.fadeOut();
                    });

                parent
                    .find(".add-probe")
                    .on("mouseup", function () {
                        var probeSet = $.map(
                            env.parentDom.find('.probe-list').bootstrapTable('getSelections'),
                            function (probe) {
                                return probe.id;
                            });

                        $this._updateSetOfProbes(probeSet);
                        parent.fadeOut();
                    });

                table
                    .addClass("table-condensed")
                    .bootstrapTable({
                        striped: true,
                        clickToSelect: true,
                        checkboxHeader: true,
                        sortOrder: "desc",
                        sortName: "name",
                        pagination: true,
                        showPaginationSwitch: false,
                        pageSize: 8,
                        pageList: [],
                        maintainSelected: true,
                        smartDisplay: true,
                        sidePagination: "client",
                        dataShowPaginationSwitch: true,
                        showFooter: false,
                        sortable: true,
                        search: true,
                        checkedBooleanField: "checked",
                        onCheckAll: function () {
                            var groupName;

                            groupName = env.parentDom.find(".group-name>input");
                            if (groupName.is(":visible")) {
                                groupName.val(env.parentDom.find(".search > input").val()).trigger("keyup");
                            }
                        },
                        columns: [
                            {
                                field: 'select',
                                title: 'Select',
                                checkbox: true
                            },
                            {
                                field: 'id',
                                title: 'Probe ID',
                                sortable: true
                            }, {
                                field: 'cc',
                                sortable: true,
                                title: 'Country'
                            }, {
                                field: 'asv4',
                                sortable: true,
                                title: 'ASv4'
                            }, {
                                field: 'asv6',
                                sortable: true,
                                title: 'ASv6'
                            }, {
                                field: 'ipv4',
                                sortable: true,
                                title: 'IPv4'
                            }, {
                                field: 'ipv6',
                                sortable: true,
                                title: 'IPv6'
                            }

                            // , {
                            //     field: 'measurements',
                            //     sortable: true,
                            //     title: 'Measurement ID'
                            // }
                        ],
                        data: data
                    });
            }


            for (var n = 0, length = data.length; n < length; n++) {
                var element;

                element = table
                    .find("tr[data-index]").find("td:eq(1):contains('" + data[n].id + "')")
                    .closest("tr[data-index]");

                if (data[n].empty) {
                    element
                        .addClass("empty-probe");
                } else {
                    element
                        .removeClass("empty-probe");
                }

            }

        };

        this.updateTimeline = function(){
            var timeRange, offsetAlignment;

            offsetAlignment = -54;
            timeRange = {
                startDate: env.metaData.startDate,
                stopDate: (env.metaData.stopDate) ? env.metaData.stopDate : moment.utc()
            };

            if (!blockListeners) {
                if (this.timeline) {
                    this.timeline
                        .data("ionRangeSlider")
                        .update({
                            min: timeRange.startDate.unix(),
                            max: timeRange.stopDate.unix(),
                            from: env.finalQueryParams.startDate.unix(),
                            to: env.finalQueryParams.stopDate.unix()
                        });
                } else {

                    this.timeline = env.parentDom
                        .find(".timeline-controller")
                        .ionRangeSlider({
                            type: "double",
                            min: timeRange.startDate.unix(),
                            max: timeRange.stopDate.unix(),
                            from: env.finalQueryParams.startDate.unix(),
                            to: env.finalQueryParams.stopDate.unix(),
                            grid: true,
                            prettify: function (num) {
                                return moment.unix(num).utc().format("Do MMMM, HH:mm");
                            },
                            onChange: function (data) {
                                var width = env.parentDom.width();
                                $this.updateTimeSelectionCone([((width / 100) * data.from_percent) + offsetAlignment, ((width / 100) * data.to_percent) + offsetAlignment]);
                                env.main.setTimeRange(moment.unix(data.from).utc().unix(), moment.unix(data.to).utc().unix());
                            },
                            onStart: function (data) {
                                var width = env.parentDom.width();
                                $this.updateTimeSelectionCone([((width / 100) * data.from_percent) + offsetAlignment, ((width / 100) * data.to_percent) + offsetAlignment]);
                            },
                            onUpdate: function(data) {
                                var width = env.parentDom.width();
                                $this.updateTimeSelectionCone([((width / 100) * data.from_percent) + offsetAlignment, ((width / 100) * data.to_percent) + offsetAlignment]);
                            }
                        });
                }
            }
        };

        this.getHostPopoverContent = hostPopover;


        this._loadControllerInteractions = function(){
            env.parentDom
                .find('.reproduction-speed>input')
                .bootstrapSlider({
                    value: env.reproductionSpeed,
                    step: 1,
                    min: 1,
                    max: config.maxReproductionSpeed,
                    tooltip: 'hide'
                })
                .on("slideStop", function (slideEvt) {

                    $(slideEvt.target)
                        .closest(".bootstrap-slider")
                        .find(".value-slider")
                        .text(slideEvt.value);

                    env.reproductionSpeed = parseInt(slideEvt.value);
                });

            env.parentDom
                .find(".close-traceroute")
                .on("click", function () {
                    env.parentDom
                        .find(".traceroute-output") // optimise this!
                        .hide();

                });

            env.parentDom
                .find('.hops-number-slider')
                .bootstrapSlider({
                    value: this.getNumberHops(),
                    step: 1,
                    min: 1,
                    max: this.maxPossibleHops(),
                    tooltip: 'hide'
                })
                .on("slideStop", function (slideEvt) {
                    $(slideEvt.target)
                        .closest(".bootstrap-slider")
                        .find(".value-slider")
                        .text(slideEvt.value);
                    headerController.setMaxHop(slideEvt.value);
                });

            env.parentDom
                .find(".select-view li")
                .click(function () {
                    var option = $(this);
                    option
                        .closest(".select-view")
                        .find('.dropdown-toggle')
                        .html(option.text() + ' <span class="caret"></span>');
                });

            env.parentDom
                .find(".click-select-probe")
                .on("click", function () {

                    $this.populateProbeList($.map(env.loadedSources, function (probe) {
                        probe.select = (env.finalQueryParams.sources.indexOf(probe.id) != -1);
                        return [probe];
                    }));
                });

            this.dom.playerButtons.play = env.parentDom
                .find(".play-button")
                .on("click", function () {
                    env.historyManager.emulateHistory();
                });

            this.dom.playerButtons.pause = env.parentDom
                .find(".pause-button")
                .on("click", function () {
                    env.historyManager.stopEmulation();
                });

            this.dom.playerButtons.beginning = env.parentDom
                .find(".bwd-button")
                .on("click", function () {
                    env.historyManager.setCurrentInstant(env.finalQueryParams.startDate);
                });

            this.dom.playerButtons.end = env.parentDom
                .find(".ffwd-button")
                .on("click", function () {
                    env.historyManager.setCurrentInstant(env.finalQueryParams.stopDate);
                });

            this.dom.labelRadio = env.parentDom
                .find('.label-level')
                .on("click", function () {
                    env.mainView.setLabelLevel($(this).val());
                });


            this._updatePlayerButtons();

            this.tracerouteDivDom = env.parentDom
                .find(".traceroute-output")
                .hide();

            this.timeSelectionCone = d3.select(env.parentDom[0])
                .select(".time-selection-cone");

            this.timeSelectionConeLeft = this.timeSelectionCone
                .append("path")
                .attr("class", "cone-time-boundaries");


            this.timeSelectionConeRight = this.timeSelectionCone
                .append("path")
                .attr("class", "cone-time-boundaries");

            this.updateSearchBox(true);
        };

        this._loadGraphInteractions = function () {
            env.parentDom
                .on("mousedown", function () {
                    $this._removeAnnotations();
                    $this.hidePopovers();
                });
            env.parentDom
                .on("mousedown", ".action-button", function (event) {
                    var item, actionAttr, targetAttr;

                    actionAttr = "data-name";
                    targetAttr = "data-target";
                    item = $(event.target);

                    if (item.is('[' + actionAttr + ']')) {
                        $this.showModal(item.attr(actionAttr), item.attr(targetAttr));
                        $this.hidePopovers();
                        $this._removeAnnotations();
                    }
                });
            env.parentDom
                .on("mousedown", ".popover", function(event){ // To prevent popover to close when clicked inside
                    $this._removeAnnotations();
                    event.preventDefault();
                    event.stopPropagation();
                });
        };

        this.init = function() {
            var partials;

            this.setListeners();
            partials = {
                "search": search(this),
                "select-view": selectView(this),
                "probes-selection": probesSelection(this)
            };

            env.parentDom
                .addClass("tracemon-container")
                .html(template(this, partials));

            this.dom.errorMessage = env.parentDom.find(".error-message");
            this.dom.loadingImage = env.parentDom.find(".loading");
            this.dom.svg = env.parentDom.find(".tracemon-svg");
            this.dom.graphContainer = env.parentDom.find(".svg-div");
            this.dom.annotation = env.parentDom.find(".annotation-tooltip");
            this.dom.footer = env.parentDom.find(".tracemon-footer");
            this.dom.content = env.parentDom.find('.tracemon-content');

            if (env.utils.getUrlParam("info") == "true") {
                this.dom.footer.append('<div class="tracemon-version footer-item">Version:' + env.version + '</div>');
                this.dom.footer.append(atob("PGRpdiBjbGFzcz0ibGF0ZW5jeW1vbi1jb3B5cmlnaHQgZm9vdGVyLWl0ZW0iPkF1dGhvcjogPGEgaHJlZj0iaHR0cDovL21hc3NpbW9jYW5kZWxhLmNvbSI+TWFzc2ltbyBDYW5kZWxhPC9hPjwvZGl2Pg=="));
            }

            headerController = new HeaderController(env);
            env.headerController = headerController;

            if (!env.onlyGraph) {
                this._loadControllerInteractions();
            }

            this._loadGraphInteractions();

        };

        this.updateTimeSelectionCone = function (points) {
            var height, width, margin;

            height = 50;
            margin = { left: 0, right: 0 };
            width = env.parentDom.width() - margin.left - margin.right;

            this.timeSelectionConeRight
                .attr("d", lineFunction([
                    {x: width + margin.left, y: height},
                    {x: points[1], y: height},
                    {x: width + margin.left, y: 0}
                ]));

            this.timeSelectionConeLeft
                .attr("d", lineFunction([
                    {x: margin.left, y: 0},
                    {x: points[0], y: height},
                    {x: margin.left, y: height}
                ]));
        };

        this.showMessage = function(show, message, options){
            options = options || {};
            options.timeout = options.timeout || Infinity;

            clearTimeout(this._timerMessageElement);
            if (show){
                this._timerMessageElement = setTimeout(function(){
                    $this.showMessage(false);
                }, Math.min(config.maxMessageTimeoutSeconds, options.timeout) * 1000);

                if (!this.dom.errorMessage.is(":visible") || !options.isLoading){ // the loading message doesn't have to overwrite the error
                    this.dom.errorMessage.text(message).show();
                }

                if (options.error) {
                    this.dom.loadingImage.addClass("warning");
                } else {
                    this.dom.loadingImage.removeClass("warning");
                }

                if (options.blink){
                    this.dom.errorMessage.addClass("blink");
                }
            } else {
                this.dom.errorMessage.text("").hide();
                this.dom.errorMessage.removeClass("blink");
                this.dom.loadingImage.removeClass("animation-on");
                this.dom.loadingImage.removeClass("warning");
            }
        };

        this._appendModal = function (modalDom, save) {
            modalDom
                .appendTo(env.parentDom)
                .show();

            modalDom
                .find(".dismiss-modal")
                .on("mouseup", function(){
                    modalDom.remove();
                });

            modalDom
                .find(".confirm-modal")
                .on("mousedown", save);
        };

        this._setLocation = function(target, locationString){
            var location, finalLocation, host;

            location = locationString.split(", ");
            if (location.length == 2){
                finalLocation = { city: location[0], countryCode: location[1] };
            } else if (location.length == 1){
                finalLocation = { city: null, countryCode: location[0] };
            } else {
                env.utils.observer.publish("error", {
                    type: 696,
                    message: config.errors[696]
                });
                return;
            }

            host = env.connector.getHosts()
                .filter(function(item){
                    return item.ip == target;
                })[0];
            host.setLocation(finalLocation);
            env.main.persist();
        };

        this.showModal = function(type, target){
            var modalDom, modalConfig, host;

            switch (type){
                case "show-traceroute":
                    modalConfig = {
                        title: "Traceroute output",
                        content: {
                            output: target.toString(),
                            traceroute: target
                        },
                        class: "show-traceroute"
                    };
                    modalDom = modalTraceroute(modalConfig);
                    $this._appendModal($(modalDom));
                    break;
                case "update-location":
                    var reverseDns;

                    host = env.connector.getHosts()
                        .filter(function(item){
                            return item.ip == target;
                        })[0];
                    reverseDns = (host.reverseDns) ? host.reverseDns.complete : null;
                    modalConfig = {
                        title: "Update location",
                        content: {
                            resource: target,
                            reverseDns: reverseDns,
                            location: host.getLocation()
                        },
                        class: "update-location-" + target
                    };
                    modalDom = $(modalLocation(modalConfig));
                    $this._appendModal(modalDom, function(event){
                        var target, newLocation;

                        target = $(event.target).attr("data-target");
                        newLocation = modalDom.find(".new-location").val();
                        $this._setLocation(target, newLocation);
                    });
                    break;

                case "edit-label":
                    modalConfig = {
                        title: "Edit label",
                        content: "Disabled for now",
                        class: "edit-label-" + target
                    };
                    modalDom = modalContacts(modalConfig);
                    $this._appendModal($(modalDom));
                    break;

                case "show-contacts":
                    env.connector.getAutonomousSystemContacts({id: target})
                        .done(function(data){
                            modalConfig = {
                                title: "Contacts for: AS" + target,
                                content: data,
                                class: "show-contacts-" + target
                            };
                            modalDom = modalContacts(modalConfig);
                            $this._appendModal($(modalDom));
                        });

                    break;

                default:
                    throw "Action not valid"
            }

        };

        this.showLoading = function(show){
            var options;

            options = {
                blink: true,
                isLoading: true
            };

            clearTimeout(this._timerLoadingElement);

            if (show) {
                this._timerLoadingElement = setTimeout(function(){
                    $this.showLoading(false);
                }, config.maxMessageTimeoutSeconds * 1000);

                this.dom.loadingImage.addClass("animation-on");
            } else {
                this.dom.loadingImage.removeClass("animation-on");
            }
            this.showMessage(show, lang.loadingMessage, options);
        };

        this.hidePopovers = function () {
            env.parentDom.find('[data-toggle="popover"]').popover('hide');
        };

        this.removePopover = function (obj) {
            obj.popover('destroy');
        };

        this.addPopover = function (domObj) {

            domObj
                .popover({
                    container: env.parentDom,
                    trigger: 'focus',
                    placement: "auto"
                });

            domObj
                .on("mousedown", function(event){
                    var popovers, visibility, item;

                    popovers = env.parentDom.find('[data-toggle="popover"]');

                    for (var n=0,length=popovers.length; n<length; n++){
                        item = $(popovers[n]);
                        visibility = (item.is($(event.target))) ? 'show' : 'hide';

                        item.popover(visibility);
                    }

                    $this._removeAnnotations();

                    // event.preventDefault();
                    // event.stopPropagation();
                    return false;
                })
                .on("mouseup", function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                })
                .on("click", function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                });
        };

    };


    return TemplateManagerView;
});