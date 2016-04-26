/**
 * Created by chad on 4/25/16.
 */

var main = angular.module('main', ['ngRoute']);
var domainURL = '//www.pjdick.com';
var dataURL = domainURL + '/VacationTracker.nsf';
var recordLockURL = domainURL + '/VacationTracker.nsf/api/data/documents';
var getLocksURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/LockedRecords';
var sysdefURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/System Defaults';
var dsMaxCount = 100; // the maximum count for the Domino data services

main.controller('mainCtrl', function($scope, $http){

    // custom functions added to scope
    $scope.createVacationRequest = createVacationRequest;
    $scope.logoutUser = logoutUser;
    
    // validation functions

    // support functions


    //============================================================================
    // BEGIN ANGULAR INITIALIZATION
    //============================================================================
    
    // initialize our variables
    initialize();
    
    function initialize(){
        
        // on load of the page, get the information for the currently authenticated user
        getUserData();
        
        // on load of the page, get the System Defaults data
        //getSystemDefaults();
        
        
    }



    function getSystemDefaults() {
        //get the System Defaults from the Domino database
        $http.get(sysdefURL).
        success(function(data) {
            $scope.systemDefaults = data[0];
            if ($rootScope.project.status == null) {
                $rootScope.project.status = data[0].statuses[0];
            }
            //alert('user data loaded');
        }).
        error(function(data, status, headers, config) {
            // log error
        });
    }

    function getUserData(){
        //get the user data for the authenticated user from the Domino server
        $http.get(dataURL + '/getLoginStatus?OpenPage').
        success(function(data) {
            //console.log(data);
            $scope.user = data;
            if ($rootScope.project.preparedBy == null){
                $rootScope.project.preparedBy = data.username;
                $rootScope.project.date = currentDateTime();
                checkLock($scope.uid);
                if (!$scope.uid){
                    setReadMode();
                }
            }
        }).
        error(function(data, status, headers, config) {
            // log error
        });
    }

    function lockDocument(){
        if (!$scope.lockedByCurrentUser) {
            var data = {
                'lockedUNID': $rootScope.project.OBJECTID,
                'lockedInfo1': $rootScope.project.jobNumber,
                'lockedInfo2': $rootScope.project.activity,
                'lockedRecordType': 'Project Information Sheet',
                'lockedUser': $scope.user.username
            };
            console.log("locking");
            if ($rootScope.project.OBJECTID) {
                $http.post(recordLockURL + "?form=Locked%20Record", data).
                then(function (response) {
                    //console.log(response)
                    $scope.lockedByCurrentUser = true;
                });
            }
        }
    }

    function checkLock(objId){
        $http.get(getLocksURL + "?keys=" + objId + "&keysexactmatch=true").
        then(function(response){
            var data = response.data;
            if (data.length > 0){
                if (data[0].LockedUser != $scope.user.username) {
                    $scope.isLocked = true;
                    $scope.lockedBy = data[0].LockedUser;
                } else {
                    $scope.lockedByCurrentUser = true;
                }
            }
        });
    }

    function unlockDocument(objId){
        if ($scope.lockedByCurrentUser) {
            $http.get(getLocksURL + "?keys=" + objId + "&keysexactmatch=true").
            then(function (response) {
                console.log(response);
                var data = response.data;
                if (data.length > 0) {
                    angular.forEach(data, function (value, key) {
                        $http.delete(value['@href']).
                        then(function (response) {
                            //console.log(response);
                        }, function (response) {
                            console.log(response);
                        });
                    });
                }
            });
        }
    }


    function createVacationRequest(){

    }

});

