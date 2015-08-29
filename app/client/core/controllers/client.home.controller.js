app.controller ('HomeController', function ($rootScope, $scope, $location, $auth, Map, Ptv, $http, User, $translate) {
    console.log ("DENTRO HOME CONTROLLER");


    $scope.results = Ptv.getResults;

    $scope.contextManoeuvre = function (index_manoeuvre) {
        $('#modal_manoeuvres table tbody tr').css ('background-color', 'white');
        $('#modal_manoeuvres table tbody tr:nth-child(' + (index_manoeuvre+1) + ')').css ('background-color', '#f2f2f2');
        var manoeuvre = $scope.results.manoeuvres[index_manoeuvre];
        var latlng = $scope.results.polygon.getLatLngs()[manoeuvre.index];
        var circle_manoeuvre = L.circle (latlng, 4, {
            stroke: true,
            color: 'gray',
            weight: 3,
            opacity: 1,
            fill: true,
            fillColor: 'white',
            fillOpacity: 1,
            className: '',                 // custom class
        });
        Map.setCircleManoeuvre (circle_manoeuvre);
    };
    $scope.showInfo = function(ev) {
        $('#modal_info').openModal();
        $('#modal_info').css ("z-index", "651");
        $('.lean-overlay').css ("display", "none");
    };

    $scope.showManoeuvres = function (ev) {
        $('#modal_manoeuvres').openModal();
        $('#modal_manoeuvres').css ("z-index", "651");
        $('.lean-overlay').css ("display", "none");
    };
    $scope.closeManoeuvres = function (ev) {
        Map.removeCircleManoeuvre();
        $('#modal_manoeuvres').closeModal();
    };



    $scope.calculateroute = function () {
        var request = {
            waypoints: Map.getWaypoints(),
            options: Ptv.getOptions(),
        };
        var that = $scope;
        $http.post ('/ptv/calculateroute', request)
        .success (function(response) {
            var points = [];
            for (i=0; i<response.polygon.lineString.points.length; i++) {
                points.push({
                    lat: response.polygon.lineString.points[i].y,
                    lng: response.polygon.lineString.points[i].x,
                })
            }
            if (that.results.polygon)
                that.map.removeLayer (that.results.polygon);
            $scope.results.polygon = L.polyline (points, {
                stroke: true,
                color: 'red',
                weight: 15,
                opacity: 0.4,
                fill: false,
                fillColor: 'red',
                fillOpacity: 0.2,
                fillRule: 'evenodd',
                dashArray: null,
                lineCap: null,
                lineJoin: null,
                clickable: true,
                pointerEvents: null,
                className: 'carretera',                 // custom class
                smoothFactor: 1.0,
                noClip: false,
                contextmenu: true,
                contextmenuInheritItems: false,
                contextmenuItems: [{
                    index: 3,
                    //icon: 'images/cross_red.png',
                    text: 'Info General',
                    callback: that.showInfo
                }, {
                    index: 4,
                    //icon: 'images/cross_red.png',
                    text: 'Maniobras',
                    callback: that.showManoeuvres
                }]

            }).addTo (that.map);
            that.results.info = response.info;
            that.results.manoeuvres = Ptv.parseManoeuvres(response.manoeuvres, response.stations, response.segments);
            Ptv.setResults({
                polygon: that.results.polygon,
                info: that.results.info,
                manoeuvres: that.results.manoeuvres
            });
        })
        .error (function(response, status) {
            console.log ("ERROR CALCULATEROUTE");
        });
    };




    $scope.addOrigin = function (ev) {
        $scope.add (ev, 0);
    };
    $scope.addDestine = function (ev) {
        $scope.add (ev, Map.lengthMarkerStations());
    };
    $scope.addIntermediate = function (ev) {
        //$scope.$apply();
        $("#modal_choice_index option:selected").removeAttr("selected");
        var value_first = $("#select_choice_index option:nth-child(1)").val();
        if ( !value_first   || value_first == '?' || value_first == '? undefined:undefined ?')
            $("#select_choice_index option:nth-child(2)").attr("selected", "selected");
        else
            $("#select_choice_index option:nth-child(1)").attr("selected", "selected");
        $('#modal_choice_index').openModal();
        var that = $scope;
        $("#button_select_choice_index").off('click').on ('click', function(e) {
            var val_selected = $("#modal_choice_index option:selected").val();
            that.add (ev, val_selected);
            $('#modal_choice_index').closeModal();
        });
    };

    $scope.initIntermediate = function() {
        $scope.options_choice_index = { singleSelect: null, availableOptions: []};
        for (i=0; i<Map.lengthMarkerStations(); i++) {
            $scope.options_choice_index.availableOptions.push ({ text: Map.Letters[i] + ': ' + Map.getMarkerStation(i).getPopup().getContent().replace(/[<]br[^>]*[>]/gi," - ").replace(/[<]b[^>]*[>]/gi,"") });
            console.log ($scope.options_choice_index.availableOptions[i].text);
        }
        if ($scope.options_choice_index.availableOptions.length == 0)
            $scope.options_choice_index.availableOptions.push ({ text: "A: Origen" });
        //$scope.$apply();
    }







    $scope.contextMenu = function (marker) {
        var that = $scope;
        marker.on ("contextmenu", function(ev) {
            var marker_selected = ev.target;
            console.log ("ev.target")
            console.log (ev.target)
            that.index_marker_selected = _.indexOf (Map.getMarkersStations(), marker_selected);
            that.$apply();
        });
    };
    $scope.dragStart = function (marker) {
        var that = $scope;
        marker.on ("dragstart", function(ev) {
            var marker_selected = ev.target;
            that.map.contextmenu.hide();
            that.latlng_dragstart = marker_selected.getLatLng();
            that.$apply();
        })
    };
    $scope.dragEnd = function (marker) {
        var that = $scope;
        marker.on ("dragend", function(ev) {
            var marker_selected = ev.target;
            marker_selected.setOpacity (0.0);
            var marker_loading = L.marker (marker_selected.getLatLng(), {icon: Map.IconLoading }).addTo (that.map);
            $http.post ('/ptv/findlocation', marker_selected.getLatLng())
            .success (function(response) {
                that.map.removeLayer (marker_loading);
                marker_selected.openPopup().getPopup().setContent (Map.formatDirPopup (response.result, true));
                marker_selected.setOpacity (1);
                if (Map.lengthMarkerStations() >= 2)
                    that.calculateroute();
            })
            .error (function(response, status) {
                if (status == 404) {
                    //console.log ("PUNTO IMPOSIBLE DE LOCALIZAR");
                    that.map.removeLayer (marker_loading);
                    marker_selected.setLatLng (that.latlng_dragstart);
                    marker_selected.update();
                    marker_selected.setOpacity (1);
                    Materialize.toast ('<span class="red">' + 'PUNTO IMPOSIBLE DE LOCALIZAR' + '</span>', 4000);
                }
            });
        });
    };


    $scope.removeMarker = function(ev) {
        Map.removeMarkerStation ($scope.index_marker_selected);                 // REMOVE
        for (i=$scope.index_marker_selected; i<Map.lengthMarkerStations(); i++) {
                var marker = Map.getMarkerStation(i);
            marker.setIcon (new L.NumberedDivIcon ({ letter: Map.Letters[i] }));
            Map.setMarkerStation (marker, i);
        }


        //$scope.options_choice_index.availableOptions.splice ($scope.index_marker_selected, 1);
        $scope.options_choice_index.availableOptions = [];
        var that = $scope;
        for (i=0; i<Map.lengthMarkerStations(); i++) {
            that.options_choice_index.availableOptions.push ({ text: Map.Letters[i] + ': ' + Map.getMarkerStation(i).getPopup().getContent().replace(/[<]br[^>]*[>]/gi," - ").replace(/[<]b[^>]*[>]/gi,"") });
            console.log (that.options_choice_index.availableOptions[i].text);
        }

        if ($scope.options_choice_index.availableOptions.length == 0)
            $scope.options_choice_index.availableOptions.push ({ text: "A: Origen" });


        $scope.$apply();
        $rootScope.$apply();
        if (Map.lengthMarkerStations() >= 2)
            $scope.calculateroute();
        else if ($scope.results.polygon) {
            Map.getMap().removeLayer ($scope.results.polygon);
            $scope.results.info = { cost: 0, distance: 0, time: 0 };
            $scope.results.manoeuvres = [];
            $scope.$apply();
            $("#modal_info, #modal_manoeuvres").closeModal();
        }
    };


    $scope.add = function (ev, index) {
        var point_selected = ev;
        var loading_marker = L.marker (point_selected.latlng, {icon: Map.IconLoading }).addTo ($scope.map);
        var that = $scope;
        $http.post ('/ptv/findlocation', point_selected.latlng)
        .success (function(response, response_ptv) {
            that.map.removeLayer (loading_marker);
            var marker = L.marker (point_selected.latlng, {
                icon: new L.NumberedDivIcon ({ letter: Map.Letters[index] }),
                draggable: true,
                contextmenu: true,
                contextmenuInheritItems: false,
                contextmenuItems: [{
                    index: 3,
                    icon: 'images/cross_red.png',
                    text: $translate.instant ('borrar'),
                    callback: that.removeMarker
                }]
            });
            that.contextMenu (marker);
            that.dragStart (marker);
            that.dragEnd (marker);
            marker.bindPopup (Map.formatDirPopup(response.result, true));
            Map.addMarkerStation (marker, index);                  //ADD TO FACTORY
            marker.openPopup();

            for (i=index; i<Map.lengthMarkerStations(); i++) {
                var marker = Map.getMarkerStation(i);
                marker.setIcon (new L.NumberedDivIcon ({letter: Map.Letters[i] }));
                Map.setMarkerStation (marker, i);
            }

            that.options_choice_index.availableOptions = [];
            for (i=0; i<Map.lengthMarkerStations(); i++) {
                that.options_choice_index.availableOptions.push({ text: Map.Letters[i] + ': ' + Map.getMarkerStation(i).getPopup().getContent().replace(/[<]br[^>]*[>]/gi," - ").replace(/[<]b[^>]*[>]/gi,"") });
                console.log (that.options_choice_index.availableOptions[i].text);
            }

            //that.$apply();
            //thut.$apply();


            if (Map.lengthMarkerStations() >= 2)
                that.calculateroute();

        })
        .error (function(response, status) {
            if (status == 404) {
                that.map.removeLayer (marker_pre);
                console.log ("PUNTO IMPOSIBLE DE LOCALIZAR");
                Materialize.toast ('<span class="red">' + 'PUNTO IMPOSIBLE DE LOCALIZAR' + '</span>', 4000);
            }
        });
    }


    $scope.renderMap = function() {
        if (Map.getMap() != undefined) {
            $("#map").replaceWith (Map.restoreMapHtml());
            if (window.innerWidth > 992)
                $("#map").css("width", window.innerWidth - 300);
            else
                $("#map").css("width", window.innerWidth);
            $("#map").css("height", window.innerHeight - 50);
        }
        else {
            if (window.innerWidth > 992)
                $("#map").css("width", window.innerWidth - 300);
            else
                $("#map").css("width", window.innerWidth);
            $("#map").css("height", window.innerHeight - 50);
            $scope.initMap();
        }
    };


    $scope.initMap = function () {
        var that = $scope;
        $scope.map = L.map('map', {
            zoomControl: false,
            attributionControl: false,
            maxBounds: ([[31.952, -18.808], [72.607, 44.472]]),
            //layers: google_maps,
            layers: Map.getLayer('google_maps'),
            contextmenu: true,
            contextmenuWidth: 160,
            contextmenuItems: [{
                index: 0,
                icon: 'images/flecha_verde.png',
                text: $translate.instant('origen'),
                callback: that.addOrigin
            }, {
                index: 1,
                icon: 'images/flecha_verde.png',
                text: $translate.instant('intermedio'),
                callback: that.addIntermediate
            }, {
                index: 2,
                icon: 'images/flecha_verde.png',
                text: $translate.instant('destino'),
                callback: that.addDestine
            }]
        }).on ('contextmenu', function (ev) {
            if (that.pointer_marker)
                that.map.removeLayer(that.pointer_marker);
            that.pointer_marker = L.marker(ev.latlng, {icon: Map.IconPushpin}).addTo(that.map);
        }).on ('contextmenu.hide', function (contextmenu, relatedTarget) {
            that.map.removeLayer(that.pointer_marker);
        }).on ('contextmenu:select', function (contextmenu, el) {
            //var index_select = $("div.leaflet-contextmenu a").index(contextmenu.el);
        }).on ('load', function (e) {
            if (e.name = "GOOGLE") {
                setTimeout(function () {
                    $("div.gmnoprint, div.gm-style-cc").fadeOut(1000, function () {
                        $("div.gmnoprint, div.gm-style-cc").remove();
                    });
                    $("img[src='http://maps.gstatic.com/mapfiles/api-3/images/google_white2.png']").first().parent().parent().parent().fadeOut(1000, function () {
                        $("img[src='http://maps.gstatic.com/mapfiles/api-3/images/google_white2.png']").first().parent().parent().parent().remove();
                    });
                }, 2000);
            }
        }).on ('baselayerchange', function (e) {
            if (e.name = "GOOGLE") {
                setTimeout(function () {
                    $("div.gmnoprint, div.gm-style-cc").fadeOut(1000, function () {
                        $("div.gmnoprint, div.gm-style-cc").remove();
                    });
                    $("img[src='http://maps.gstatic.com/mapfiles/api-3/images/google_white2.png']").first().parent().parent().parent().fadeOut(1000, function () {
                        $("img[src='http://maps.gstatic.com/mapfiles/api-3/images/google_white2.png']").first().parent().parent().parent().remove();
                    });
                }, 2000);
            }
        }).setView([41.9204014, -1.2529047000000446], 18);


        Map.setMap ($scope.map);
        Map.addMarkerBugRestaure()
        //var marker_bug_google = L.marker([0, 0], {opacity: 0.0}).addTo(that.map);           // marker hidden necessary for fix bug in layer google maps in Android, when Zoom -> Crash

                                                          // Save Map in Factory
    };











    console.log ("PAYLOAD");
    console.log ($auth.getPayload());






    $scope.mostrar_posicion = function (posicion) {
        //console.log ("LATITUD");
        //console.log (posicion.coords.latitude);
        $scope.latitud = posicion.coords.latitude;
        //console.log ("LONGITUD");
        //console.log (posicion.coords.longitude);
        $scope.$apply();
    };
    $scope.error_posicion = function (error) {
        console.log ("DENTRO OBETNER FRACASO");
        switch (error.code) {
            case error.PERMISSION_DENIED:
                console.log ("User denied the request for Geolocation.");
                break;
            case error.POSITION_UNAVAILABLE:
                console.log ("Location information is unavailable.");
                break;
            case error.TIMEOUT:
                console.log ("The request to get user location timed out.");
                break;
            case error.UNKNOWN_ERROR:
                console.log ("An unknown error occurred.");
                break;
        };
    }
    navigator.geolocation.getCurrentPosition ($scope.mostrar_posicion, $scope.error_posicion, { enableHighAccuracy: true });
});
