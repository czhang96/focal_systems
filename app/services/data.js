angular.module('data', []).
factory('dataFactory', ['$http', function($http){
  var data = {};

  // simple data factory
  data.getData = function(){
    return new Promise(function(resolve, reject){
      $http.get('services/interview.json')
      .success(function(data){
        resolve(data);
      });
    });
  };

  return data
}]);
  