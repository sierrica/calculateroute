
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

angular.element(document).ready(function() {
	angular.bootstrap(document, ['calculateRoute']);
});