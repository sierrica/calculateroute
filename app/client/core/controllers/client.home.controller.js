app.controller ('HomeController', ['$rootScope', '$scope', '$location', '$auth', 'Map', '$http', function($rootScope, $scope, $location, $auth, Map, $http, User) {
    console.log ("DENTRO HOME CONTROLLER");

    $scope.map = function () {
        Map.initMap();
    };




    console.log ("PAYLOAD");
    console.log ($auth.getPayload());
/*
    User.me.get().$promise.then(function(response) {
        $rootScope.user = response.user;
        console.log ($rootScope.user);
        if ($rootScope.user.lang != document.documentElement.lang) {
            document.documentElement.lang = $rootScope.user.lang;
            tmhDynamicLocale.set ($rootScope.user.lang.toLowerCase());
            $translate.use ($rootScope.user.lang);
        }
    });
*/
    $scope.calculateroute = function () {
        $http.post ('/ptv/calculateroute', $scope.credentials)
             .success(function(response) {
                console.log ("EXITO");
                console.log (response);
            })
            .error(function(response) {
            console.log ("FRACASO");
            console.log (response);
        });
    }

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
}]);
