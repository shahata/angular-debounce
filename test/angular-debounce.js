'use strict';

describe('unit testing angular debounce service', function () {
  var debounce, $timeout;

  beforeEach(module('debounce'));

  beforeEach(function () {
    inject(function (_debounce_, _$timeout_) {
      debounce = _debounce_;
      $timeout = _$timeout_;
    });
  });

  it('should invoke callback after specified delay', function () {
    var spy = jasmine.createSpy('debounceFunc');
    debounce(spy, 100)();
    expect(spy).not.toHaveBeenCalled();
    $timeout.flush(100);
    expect(spy).toHaveBeenCalled();
  });

  it('should wait again if another call arrives during wait', function () {
    var spy = jasmine.createSpy('debounceFunc');
    var debounced = debounce(spy, 100);
    debounced();
    $timeout.flush(99);
    debounced();
    $timeout.flush(99);
    expect(spy).not.toHaveBeenCalled();
    $timeout.flush(1);
    expect(spy).toHaveBeenCalled();
  });

  it('should pass the arguments from the last call to the callback', function () {
    var spy = jasmine.createSpy('debounceFunc');
    var debounced = debounce(spy, 100);
    debounced(1);
    debounced(2);
    debounced(3);
    $timeout.flush(100);
    expect(spy.calls.length).toEqual(1);
    expect(spy).toHaveBeenCalledWith(3);
  });

  it('should be able to create multiple unrelated debouncers', function () {
    var spy = jasmine.createSpy('debounceFunc');
    var spy2 = jasmine.createSpy('debounceFunc2');
    debounce(spy, 100)(1);
    debounce(spy2, 100)(2);
    $timeout.flush(100);
    expect(spy).toHaveBeenCalledWith(1);
    expect(spy2).toHaveBeenCalledWith(2);
  });

  it('should return the value from the last debounce', function () {
    var spy =  jasmine.createSpy('debounceFunc').andCallFake(angular.identity);
    var debounced = debounce(spy, 100);
    expect(debounced(1)).toEqual(undefined);
    $timeout.flush(100);
    expect(debounced(2)).toEqual(1);
  });

  it('should support immediate mode where the leading edge function is triggered instead of the trailing', function () {
    var spy = jasmine.createSpy('debounceFunc');
    var debounced = debounce(spy, 100, true);
    debounced(1);
    debounced(2);
    debounced(3);
    expect(spy).toHaveBeenCalledWith(1);
    $timeout.flush(100);
    expect(spy.calls.length).toEqual(1);
    debounced(2);
    expect(spy).toHaveBeenCalledWith(2);
  });

  it('should support canceling of debounce, returning triggers to default state', function () {
    var spy = jasmine.createSpy('debounceFunc');
    var debounced = debounce(spy, 100);
    debounced();
    debounced.cancel();
    $timeout.flush(100);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should support canceling correctly also for immediate mode', function () {
    var spy = jasmine.createSpy('debounceFunc');
    var debounced = debounce(spy, 100, true);
    debounced(1);
    expect(spy).toHaveBeenCalledWith(1);
    debounced.cancel();
    debounced(2);
    expect(spy).toHaveBeenCalledWith(2);
  });
});

describe('unit testing angular debounce directive', function () {
  var $compile, $rootScope, element, defer, debounce;

  beforeEach(module('debounce'));

  beforeEach(function () {
    defer = null;
    module(function ($provide) {
      $provide.service('debounce', function ($q) {
        debounce = jasmine.createSpy('debounce').andCallFake(function (func) {
          /* jshint validthis:true */
          function debounced() {
            var args = arguments;
            defer = $q.defer();
            defer.promise.then(function () {
              func.apply(this, args);
            }.bind(this));
          }
          debounced.cancel = function () {
            if (defer) {
              defer.reject();
            }
          };
          return debounced;
        });
        return debounce;
      });
    });

    inject(function ($injector) {
      $compile = $injector.get('$compile');
      $rootScope = $injector.get('$rootScope');
    });
  });

  it('should wait with updating of model until debounce is triggered', function () {
    element = $compile('<input type="text" ng-model="blah" debounce="100"></input>')($rootScope);
    element.val('shahar');
    element.trigger('change');
    expect($rootScope.blah).toBeFalsy();
    defer.resolve();
    $rootScope.$digest();
    expect($rootScope.blah).toEqual('shahar');
  });

  it('should cancel pending view changes when model is changed', function () {
    element = $compile('<input type="text" ng-model="blah" debounce="100"></input>')($rootScope);
    element.val('shahar');
    element.trigger('change');
    $rootScope.blah = 'talmi';
    $rootScope.$digest();
    defer.resolve();
    $rootScope.$digest();
    expect($rootScope.blah).toEqual('talmi');
  });

  it('should return previous value while debouncing', function () {
    element = $compile('<input type="text" ng-model="blah" debounce="100"></input>')($rootScope);
    element.val('shahar');
    element.trigger('change');
    defer.resolve();
    $rootScope.$digest();
    element.val('talmi');
    element.trigger('change');
    expect($rootScope.blah).toEqual('shahar');
  });

  it('should return previous model while debouncing', function () {
    element = $compile('<input type="text" ng-model="blah" debounce="100"></input>')($rootScope);
    $rootScope.blah = 'shahar';
    $rootScope.$digest();
    element.val('talmi');
    element.trigger('change');
    expect($rootScope.blah).toEqual('shahar');
  });

  it('should live well with other parsers', function () {
    element = $compile('<input type="checkbox" ng-model="blah" debounce="100" ng-true-value="YES" ng-false-value="NO"></input>')($rootScope);
    $rootScope.blah = 'YES';
    $rootScope.$digest();
    element.click();
    defer.resolve();
    $rootScope.$digest();
    expect($rootScope.blah).toEqual('NO');
  });

  it('should invoke debounce with delay param', function () {
    element = $compile('<input type="text" ng-model="blah" debounce="100"></input>')($rootScope);
    expect(debounce).toHaveBeenCalledWith(jasmine.any(Function), 100, false);
  });

  it('should invoke debounce with immediate param', function () {
    element = $compile('<input type="text" ng-model="blah" debounce="100" immediate="true"></input>')($rootScope);
    expect(debounce).toHaveBeenCalledWith(jasmine.any(Function), 100, true);
  });

});
