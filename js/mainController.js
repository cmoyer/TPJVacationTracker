/**
 * Created by chad on 4/25/16.
 */

var main = angular.module('main', ['ngRoute', 'angularUUID2'])
    .controller('mainCtrl',['$rootScope','$scope', '$location', '$http', '$window', 'uuid2', MainCtrl]);
var domainURL = '//www.pjdick.com';
var dataURL = domainURL + '/VacationTracker.nsf';
var recordLockURL = domainURL + '/VacationTracker.nsf/api/data/documents';
var dataPOST = domainURL + '/VacationTracker.nsf/api/data/documents';
var getLocksURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/LockedRecords';
var getGroupURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/GroupsREST';
var sysdefURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/SystemDefaults';
var vacationProfileURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/VacationProfilesREST';
var dsMaxCount = 100; // the maximum count for the Domino data services

function MainCtrl($rootScope, $scope, $location, $http, $window, uuid2){
    
    // custom functions added to scope
    $scope.createVacationRequest = createVacationRequest;
    $scope.logoutUser = logoutUser;
    $scope.getUserData = getUserData;
    $scope.lockDocument = lockDocument;
    $scope.allowEdits = allowEdits;
    $scope.isLocked = false;
    $scope.lockedBy = false;
    $scope.lockedByCurrentUser = false;
    $scope.readMode = true;
    



    // support functions
    $scope.saveVacationRequest = saveVacationRequest;
    $scope.editVacationRequest = editVacationRequest;
    $scope.getVacationProfile = getVacationProfile;



    //============================================================================
    // BEGIN ANGULAR INITIALIZATION
    //============================================================================
    
    // initialize our variables
    initialize();
    
    function initialize(){
        $scope.mainForm = {};
        $rootScope.vacationRequest = {};
        $rootScope.vacationProfile = {};
        $rootScope.group = {};


        // //watch for the empNotesName to change
        // $rootScope.$watch('empNotesName', function(value) {
        //
        //     $rootScope.empNotesName = value;
        //
        // });
        //
        // //watch for the Group to change
        // $rootScope.$watch('Group', function(value) {
        //     $rootScope.Group = value;
        // });

        // on load of the page, get the information for the currently authenticated user
        getUserData();


        // on load of the page, get the System Defaults data
        getSystemDefaults();



    }

    function getSystemDefaults() {
        //get the System Defaults from the Domino database
        $http.get(sysdefURL).
        success(function(data) {
            $scope.systemDefaults = data[0];
        }).
        error(function(data, status, headers, config) {
            // log error
            //console.log("error");
        });
    }


    function getUserData(){
        //get the user data for the authenticated user from the Domino server
        $http.get(dataURL + '/getLoginStatus?OpenPage').
        success(function(data) {
            //console.log(data);
            $scope.user = data;
            if ($rootScope.vacationRequest.preparedBy == null){
                $rootScope.vacationRequest.preparedBy = data.username;
                $rootScope.vacationRequest.date = currentDateTime();
                $rootScope.vacationRequest.empNotesName = "CN=" + $scope.user.username + "/O=TPJ";
            }
            getVacationProfile();




        }).
        error(function(data, status, headers, config) {

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
       $window.location.href = "requestForm.html";

    }

    function saveVacationRequest(){


        //getUserData();
        $rootScope.vacationRequest.empName = $scope.user.username;
        $rootScope.vacationRequest.date = currentDateTime();
        $rootScope.vacationRequest.status = "New";
        $rootScope.vacationRequest.empNotesName = "CN=" + $scope.user.username + "/O=TPJ";


        var v = $rootScope.vacationRequest;
        var attr = {
            "empName": v.empName,
            "date": v.date,
            "status": v.status,
            "empUserName": v.empNotesName

            //"VacationID": p.VacationID
        };


        // loop through all of the radio buttons on the form and grab the checked values
        var myForm = $window.document.getElementById('myForm');
        var myElements = myForm.getElementsByTagName("input");
        var total = 0;
        var hrs = 0;

        var selectedDays = [];
        for (i=0; i<myElements.length; i++){
            if (myElements[i].checked == true){
                selectedDays.push(myElements[i]);
                if (myElements[i].value == "Whole"){
                    hrs = 8;
                } else {
                    hrs = 4;
                }
                total += hrs;
            }
        }

        
        $rootScope.vacationRequest.hoursThisRequest = total;
        $rootScope.vacationRequest.datesRequested = selectedDays;

        var length = selectedDays.length;
        var startDate = new Date(selectedDays[0].name);
        var endDate = new Date(selectedDays[length-1].name);

        //create the notes backend document
        //get the System Defaults from the Domino database

        var data = {
            'empName': $rootScope.vacationRequest.empName,
            'date': $rootScope.vacationRequest.date,
            'startDate': startDate,
            'endDate': endDate,
            'status': $rootScope.vacationRequest.status,
            'empNotesName': $rootScope.vacationRequest.empNotesName,
            'hoursThisRequest': $rootScope.vacationRequest.hoursThisRequest,
            'Approvers': $rootScope.vacationRequest.approvers
            // 'datesRequested': $rootScope.vacationRequest.datesRequested
        };

        console.log(data);

        $http.post(dataPOST + "?form=Vacation%20Request", data).
        then(function (response) {
            console.log(response)

        });


        // var newEvent = new Object();
        //
        // newEvent.title = $rootScope.vacationRequest.empName;
        // newEvent.start = new Date(selectedDays[0].name);
        // var tmpEnd = new Date(selectedDays[length-1].name);
        // newEvent.end = tmpEnd.setDate(tmpEnd.getDate() + 1);
        // newEvent.allDay = false;
        // $('#calendar').fullCalendar( 'renderEvent', newEvent );
        
            
    }

    //TODO: edit vacation request
    function editVacationRequest(){

    }

    //TODO: submit vacation request
    function submitVacationRequest(){

    }

    //TODO: cancel vacation request
    function cancelVacationRequest(){

    }

    function setReadMode(){
        //if the user is an Editor, then set readMode = false
        var u = $scope.user;
        var sd = $scope.systemDefaults;
        var p = $rootScope.project;
        var isEditor = false;
        var isFinalStatus = false;
        var readMode = true;

        //check to see if the current user is an editor
        if (u){
            if (u.dbaccess == "Editor"){
                isEditor = true;
            }
        }

        if (isEditor && !isFinalStatus && !$scope.isLocked){
            readMode = false;
            lockDocument();
        } else {
            readMode = true;
        }
        $scope.readMode = readMode;
    }

    function allowEdits(){
        var u = $scope.user;
        var sd = $scope.systemDefaults;
        var p = $rootScope.project;
        var isEditor = false;
        var isFinalStatus = false;
        var allow = false;

        //check to see if the current user is an editor
        if (u){
            if (u.dbaccess == "Editor"){
                isEditor = true;
            }
        }

        if (isEditor && !$scope.isLocked){
            allow = true;
        }
        return allow;
    }

    function callFunction(name){
        if(angular.isFunction($scope[name]))
            $scope[name]();
    }

    function runEvalCode() {
        eval($scope.evalStr);
    }


    function getVacationProfile(){
        var u = $rootScope.vacationRequest.empNotesName;
        var requestString = vacationProfileURL + "?keys=" + u + "&keysexactmatch=true";
        $http.get(requestString).
        success(function(data) {
            $rootScope.vacationProfile = data;
            getUserGroup();


        }).
        error(function(data, status, headers, config) {
            // log error
        });
    }



    function getUserGroup(){

        var groupName = $rootScope.vacationProfile[0].Group;
        var requestString = getGroupURL + "?keys=" + groupName + "&keysexactmatch=true";
        $http.get(requestString).
        success(function(data) {
            $rootScope.group = data;
            $rootScope.vacationRequest.approvers = $rootScope.group[0].Approvers;
            console.log($rootScope.vacationRequest.approvers);
        }).
        error(function(data, status, headers, config) {
            // log error
        });

    }


}