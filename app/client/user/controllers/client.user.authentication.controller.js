app.controller ('AuthenticationController', ['$rootScope', '$scope', '$http', 'SatellizerShared', '$auth', '$location', 'tmhDynamicLocale', '$translate', 'User', '$state', function($rootScope, $scope, $http, shared, $auth, $location, tmhDynamicLocale, $translate, User, $state) {

	console.log ("DENTRO AUTHENTICATION CONTROLLER");

    var user = User.getUser();
    $scope.email = user.email;
    $scope.lang = user.lang;
    $scope.$on('login', function (event) {
        user = User.getUser();
        $scope.email = user.email;
        $scope.lang = user.lang;
    });

    $scope.lang_default = function() {
        var lang = document.documentElement.lang;
        $scope.lang = lang;
        $("#lang").select2 ("val", lang);
    };

    $scope.checkPassword = function(form) {
        if (form == 'signupForm')
            $scope.signupForm.confirm_password.$error.dontMatch = $scope.password != $scope.confirm_password;
        else if (form == 'profileForm')
            $scope.profileForm.confirm_password.$error.dontMatch = $scope.password != $scope.confirm_password;
    };


    $scope.forgot = function() {
        $http.post ('/forgot', {email: $scope.email})
        .success (function(response) {
            Materialize.toast ('<span class="green">' + $translate.instant('En breves recibiras un email con la nueva contrasena') + '</span>', 5000);
        }).error (function(response, status) {
            console.log ("ERROR CALCULATEROUTE");
        });
    }

    $scope.updateProfile = function() {
        User.me.update ({
            email: $scope.email,
            password: $scope.password,
            lang: $scope.lang
        }, function(response) {
            $scope.email = response.email;
            $scope.lang = response.lang;
            if ($scope.lang != document.documentElement.lang)
                User.change_lang ($scope.lang);
            Materialize.toast ('<span class="green">' + $translate.instant('Cambios realizados correctamente') + '</span>', 5000);
        }, function(response) {
            Materialize.toast ('<span class="red">' + $translate.instant('Cambios no realizados correctamente') + '</span>', 5000);
        });
    };


    $scope.remember = false;
    $scope.signup = function() {
        if ($scope.remember)
            shared.setStorageType ("localStorage");
        else
            shared.setStorageType ("sessionStorage");
        $auth.signup ({
            email: $scope.email,
            password: $scope.password,
            lang: $scope.lang
        }).then (function() {
            Materialize.toast ('<span class="green">' + $translate.instant('properly registered') + '</span>', 5000);
            $scope.login();
        }).catch (function(response) {
            Materialize.toast ('<span class="red">' + $translate.instant(response.data.message) + '</span>', 5000);
        });
    };
    $scope.login = function() {
        if ($scope.remember)
            shared.setStorageType ("localStorage");
        else
            shared.setStorageType ("sessionStorage");
        $auth.login ({
            email: $scope.email,
            password: $scope.password
        }).then (function() {
            User.me.get().$promise.then(function(response) {
                var user = response.user;
                user.name = response.user.email.split("@")[0];
                User.setUser (user);
                if (response.user.lang != document.documentElement.lang)
                    User.change_lang (response.user.lang);
                $state.transitionTo ("home");
                Materialize.toast ('<span class="green">' + $translate.instant('properly entered') + '</span>', 5000);
                $rootScope.$emit ('login');
            });
        }).catch (function(response) {
            Materialize.toast ('<span class="red">' + $translate.instant(response.data.message) + '</span>', 5000);
        });
    };
}]);
