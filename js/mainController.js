/**
 * Created by chad on 4/25/16.
 */

var main = angular.module('main', []);
var domainURL = '//www.pjdick.com';
var dataURL = domainURL + '/VacationTracker.nsf';
var recordLockURL = domainURL + '/VacationTracker.nsf/api/data/documents';
var getLocksURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/LockedRecords';
var sysdefURL = domainURL + '/PNGRestoration.nsf/api/data/collections/name/SystemDefaults';
var dsMaxCount = 100; // the maximum count for the Domino data services

main.controller('mainCtrl', function($scope, $http){

    //custom functions added to scope

    //validation functions

    //support functions





});


