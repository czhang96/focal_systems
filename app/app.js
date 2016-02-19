'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'myApp.view1',
  'myApp.view2',
  'myApp.directives',
  'myApp.version'
])

// Seperate module with custom d3 directives
angular.module('myApp.directives', ['data']);
