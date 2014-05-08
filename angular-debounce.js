'use strict';

angular.module('debounce', [])
  .value('now', function () {
    return new Date();
  })
  .service('debounce', ['$timeout', 'now', function ($timeout, now) {
    return function (func, wait, immediate) {
      var timeout, args, context, timestamp, result;
      function debounce() {
        /* jshint validthis:true */
        context = this;
        args = arguments;
        timestamp = now();
        var later = function () {
          var last = now() - timestamp;
          if (last < wait && !$timeout.flush) {
            timeout = $timeout(later, wait - last);
          } else {
            timeout = null;
            if (!immediate) {
              result = func.apply(context, args);
            }
          }
        };
        var callNow = immediate && !timeout;
        if (!timeout) {
          timeout = $timeout(later, wait);
        }
        if (callNow) {
          result = func.apply(context, args);
        }
        return result;
      }
      debounce.cancel = function () {
        $timeout.cancel(timeout);
        timeout = null;
      };
      return debounce;
    };
  }])
  .directive('debounce', ['debounce', function (debounce) {
    return {
      require: 'ngModel',
      priority: 999,
      scope: {
        debounce: '@',
        immediate: '@'
      },
      link: function ($scope, $element, $attrs, ngModelController) {
        var debouncedValue, pass;
        var prevRender = ngModelController.$render.bind(ngModelController);
        var commitSoon = debounce(function (viewValue) {
          pass = true;
          ngModelController.$setViewValue(viewValue);
          pass = false;
        }, parseInt($scope.debounce), $scope.immediate === 'true');
        ngModelController.$render = function () {
          prevRender();
          commitSoon.cancel();
          //we must be first parser for this to work properly,
          //so we have priority 999 so that we unshift into parsers last
          debouncedValue = this.$viewValue;
        };
        ngModelController.$parsers.unshift(function (value) {
          if (pass) {
            debouncedValue = value;
            return value;
          } else {
            commitSoon(ngModelController.$viewValue);
            return debouncedValue;
          }
        });
      }
    };
  }]);
