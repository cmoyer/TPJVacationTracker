/**
 * Created by chad on 4/25/16.
 */

var main = angular.module('main', ['ngMessages','ui.calendar', 'ngRoute','angularUUID2'])
    .controller('mainCtrl',['$rootScope','$scope', '$location', '$http', '$compile', '$timeout','$window', 'uuid2', MainCtrl]);
var domainURL = '//www.pjdick.com';
var dataURL = domainURL + '/VacationTracker.nsf';
var recordLockURL = domainURL + '/VacationTracker.nsf/api/data/documents';
var dataPOST = domainURL + '/VacationTracker.nsf/api/data/documents';
var dataPUT = domainURL + '/VacationTracker.nsf/api/data/documents/unid/';
var getLocksURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/LockedRecords';
var getGroupURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/GroupsREST';
var sysdefURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/SystemDefaults';
var vacationProfileURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/VacationProfilesREST';
var vacationRequestsbyIDURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/VacationRequestsbyIDREST';
var vacationRequestsbyGroupURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/VacationRequestsbyGroupREST';
var vacationRequestsbyApproverURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/VacationRequestsbyApproverREST';
var vacationDaysbyIDURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/VacationDaysbyIDREST';
var vacationRequestsURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/VacationRequestsREST';
var holidayURL = domainURL + '/TimeTracking.nsf/api/data/collections/name/HolidaysREST';
var dsMaxCount = 100; // the maximum count for the Domino data services
var unidStr = "@unid";

function MainCtrl($rootScope, $scope, $location, $http, $compile, $timeout, $window, uuid2){



    //get the uid of the project that the user is attmepting to access
    $scope.uid = getQueryString("uid");



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
    $scope.isMobileDevice = false;
    $scope.processing = false;
    $scope.isProcessing = isProcessing;

 
    $scope.getVacationProfile = getVacationProfile;
    $scope.getMyVacationRequests = getMyVacationRequests;
    $scope.getMyVacationRequestsToApprove = getMyVacationRequestsToApprove;
    $scope.getVacationRequestsByGroup = getVacationRequestsByGroup;
    $scope.updateVacationProfile = updateVacationProfile;
    $scope.getRequest = getRequest;
    $scope.openRequest = openRequest;
    // $scope.recalculateDates = recalculateDates;
    $scope.recalculateHours = recalculateHours;
    $scope.addComments = addComments;
    $scope.hasComments = hasComments;
    $scope.promptForComments = promptForComments;
    $scope.cancelComments = cancelComments;
    var ismobi = navigator.userAgent.match(/Mobi/i);

    // Hide/When functions
    $scope.isNew = isNew;
    $scope.isSaved = isSaved;
    $scope.isSubmitted = isSubmitted;
    $scope.isTaken = isTaken;
    $scope.isApprover = isApprover;
    $scope.isCanceled = isCanceled;

    // Saving and Status Changes of Requests
    $scope.saveVacationRequest = saveVacationRequest;
    $scope.submitVacationRequest = submitVacationRequest;
    $scope.approveVacationRequest = approveVacationRequest;
    $scope.rejectVacationRequest = rejectVacationRequest;
    $scope.cancelVacationRequest = cancelVacationRequest;
    $scope.closeVacationRequest = closeVacationRequest;
    $scope.deleteVacationRequest = deleteVacationRequest;
    $scope.deleteVacationDayDocuments = deleteVacationDayDocuments;
    $scope.createVacationDayDocuments = createVacationDayDocuments;

    //============================================================================
    // BEGIN ANGULAR INITIALIZATION
    //============================================================================

    // initialize our variables
    initialize();



    
    function initialize(){
        $scope.mainForm = {};
        $scope.hoursThisRequest = 0;
        $rootScope.vacationRequest = {};
        $rootScope.vacationRequest.hoursThisRequest = 0;
        $rootScope.vacationProfile = {};
        $rootScope.myVacationRequests = {};
        $rootScope.myVacationRequestsToApprove = {};
        $rootScope.groupVacationRequests = {};
        $rootScope.holidayList = {};
        $rootScope.vacationRequest.requestComments = "";
        $rootScope.vacationRequest.requestedDates = [{}];
        $rootScope.vacationRequest.requestedDates.shift();
        $rootScope.vacationRequest.dayUNID = [];
        $rootScope.Answers = {};
        $rootScope.group = {};
        $scope.events = [];
        $rootScope.clickedRequest = {};
        $scope.modalResponse = "none";
        $scope.modal = {};
        $scope.modal.buttons = [];
        $rootScope.previousLocation = "";
       



        if(ismobi == null){
            $scope.isMobileDevice = false;
        } else{
            $scope.isMobileDevice = true;
        }


        //Update the Calendars
        $rootScope.$watch('groupVacationRequests', function(value) {
            if (value != null){

                $scope.eventSources = [$scope.events];

                //Update all of the calendars
                $('#calendar').fullCalendar( 'removeEventSource', $scope.eventSources);
                $('#calendar').fullCalendar( 'addEventSource', $scope.eventSources[0]);
                $('#calendar').fullCalendar( 'refetchEvents' );

                $('#readCalendar').fullCalendar( 'removeEventSource', $scope.eventSources);
                $('#readCalendar').fullCalendar( 'addEventSource', $scope.eventSources[0]);
                $('#readCalendar').fullCalendar( 'refetchEvents' );

                $('#editCalendar').fullCalendar( 'removeEventSource', $scope.eventSources);
                $('#editCalendar').fullCalendar( 'addEventSource', $scope.eventSources[0]);
                $('#editCalendar').fullCalendar( 'refetchEvents' );
                // console.log($scope);
            }
        });





        // on load of the page, get the information for the currently authenticated user
        getUserData();


        // on load of the page, get the System Defaults data
        getSystemDefaults();

        // on load of the page, get the Holiday List from Time Tracking
        getHolidayList();

        if ($scope.uid != null) {
            getRequest($scope.uid);
        }

        console.log($rootScope);

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

    function getHolidayList(){
        //get the System Defaults from the Domino database
        $http.get(holidayURL + "?count=" + dsMaxCount).
        success(function(data) {
            $rootScope.holidayList = data;
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
            if ($rootScope.empNotesName == null){
                $rootScope.empName = $scope.user.username;
                $rootScope.empNotesName = "CN=" + $scope.user.username + "/O=TPJ";
            }
            getVacationProfile();
            getMyVacationRequests();
            getMyVacationRequestsToApprove();
            // alert($rootScope.groupName);
            // getVacationRequestsByGroup($rootScope.groupName);
            // getAllVacationRequests();

        }).
        error(function(data, status, headers, config) {

        });
    }

    function logoutUser(){
        //log the current user out and then redirect them
        var currURL = window.location;
        window.location = dataURL + "?Logout&RedirectTo=" + currURL;
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
        $rootScope.clickedRequest = null;
        $window.location.href = "requestForm.html";

    }

    function deleteVacationDayDocuments(){
        var vacationDaysRequestString = vacationDaysbyIDURL + "?keys=" + $rootScope.vacationRequest.requestID + "&keysexactmatch=true";
       $http.get(vacationDaysRequestString)
            .then(function(data){

                var arrUNID = [];
                for(var i = 0; i < data.length; i++){
                    arrUNID.push(data[i][unidStr]);
                }

                for (var j=0; j < arrUNID.length; j++){
                    var deleteString = dataPUT + "/" + arrUNID[j];
                    $http.delete(deleteString).
                    success(function(data){

                    }).
                    error(function(data, status, headers, config){

                    });

                }

               

        }).catch(function(data,status,headers,config){

        });
    }

    function createVacationDayDocuments(){

        //if the doc has been created, update, else, post
        for (var i=0; i < $rootScope.vacationRequest.requestedDates.length; i++){
            var docExists = false;

            var tmpData = {
                'empName': $rootScope.vacationRequest.empName,
                'name': $rootScope.vacationRequest.requestedDates[i].name,
                'value': $rootScope.vacationRequest.requestedDates[i].value,
                'lookupKey': $rootScope.vacationRequest.requestID
            };

            for(var j=0; j < $rootScope.vacationRequest.requestedDates.length; j++){
                console.log($rootScope.vacationRequest.requestedDates[j].name);
                console.log(tmpData.name);
                console.log($rootScope.vacationRequest.requestedDates[j].unid);
                if ($rootScope.vacationRequest.requestedDates[j].name == tmpData.name && $rootScope.vacationRequest.requestedDates[j].unid != null){
                    docExists = true;
                }
            }

            if (docExists == true){
                var putStr = dataPUT + $rootScope.vacationRequest.requestedDates[i].unid;
                $http.put(putStr, tmpData).then(function (response){
                    // console.log(response)
                });
            } else {
                $http.post(dataPOST + "?form=Vacation%20Day", tmpData).then(function (response) {
                    // console.log(response)
                });
            }
        }
    }

    function saveVacationRequest(){

        // var myFirstDeferred = $q.defer();

        $rootScope.vacationRequest.date = currentDate();
        $rootScope.vacationRequest.status = "New";


        if($rootScope.vacationRequest.empName == null){
            $rootScope.vacationRequest.empName = $rootScope.empName;
        }

        if($rootScope.vacationRequest.empNotesName == null){
            $rootScope.vacationRequest.empNotesName = $rootScope.empNotesName;
        }

        if($rootScope.vacationRequest.groupName == null){
            $rootScope.vacationRequest.groupName = $rootScope.groupName;
        }
        //$rootScope.vacationRequest.requestComments = "";
        var selectedDays = $rootScope.vacationRequest.requestedDates;
        var length = selectedDays.length;

        if (length == 0){
            $scope.modal.title = "Not Enough Information to Save";
            $scope.modal.body = "You must select at least one day on the calendar before saving.";
            $scope.modal.buttons = [];
            var button1 = {};
            button1.label = "OK";
            button1.callback = "";
            $scope.modal.buttons.push(button1);
            $('#myModal').modal('show');
        } else {


            // set the request ID
            if ($rootScope.vacationRequest.requestID == null) {
                $rootScope.vacationRequest.requestID = "{" + uuid2.newguid() + "}"
            }



            var data = {
                'empName': $rootScope.vacationRequest.empName,
                'date': $rootScope.vacationRequest.date,
                'startDate': $rootScope.vacationRequest.startDate.format("mm/dd/yyyy"),
                'endDate': $rootScope.vacationRequest.endDate.format("mm/dd/yyyy"),
                'STATUS': $rootScope.vacationRequest.status,
                'EMPNOTESNAME': $rootScope.vacationRequest.empNotesName,
                'hoursThisRequest': $rootScope.vacationRequest.hoursThisRequest,
                'Approvers': $rootScope.vacationRequest.approvers,
                'groupName': $rootScope.vacationRequest.groupName,
                'requestComments': $rootScope.vacationRequest.requestComments,
                'requestID': $rootScope.vacationRequest.requestID,
                'numberOfDays': $rootScope.vacationRequest.requestedDates.length
                //'requestedDates': $rootScope.vacationRequest.requestedDates
            };



            // console.log(data);
            if($rootScope.vacationRequest.unid == null) {
                $http.post(dataPOST + "?form=Vacation%20Request", data).then(function (response) {
                    // console.log(response)
                });
            } else {

                $http.put(dataPUT + $rootScope.vacationRequest.unid + "?form=Vacation%20Request", data).then(function (response){
                    // console.log(response)
                });
            }

            createVacationDayDocuments();

            // THIS NEEDS TO BE HERE TO GET THE UNID OF THE LOTUS DOCUMENT BECAUSE WE ARE NO LONGER CLOSING THE FORM.
            $timeout(openRequest($rootScope.vacationRequest.requestID), 2000);

        }


    }

    //TODO: calculateHoursForOverage
    function calculateHoursForOverage(arrDates){
        // check to see which years are included in this request

        // then check to see if the user has a vacation profile for each of those years
        // if not, throw a flag and don't continue.

        // if they have profiles for each, get a value of hours requested for each year

        // compare each year to the respective Vacation Profile hours remaining value

        // if there is an overage on either document, prompt the user and ask if they would still like to save

        //if they confirm, return true, else, return false
    }

    //TODO: check user's vacation profile hours vs hours requested.
    function submitVacationRequest(){
        var readyToSubmit = $rootScope.vacationRequest.unid;
        if (readyToSubmit != null) {


            var data = {
                'STATUS': "Submitted"
            };


            $http.patch(dataPUT + $rootScope.vacationRequest.unid + "?form=Vacation%20Request", data).then(function (response) {
                // console.log(response);
            });

            createVacationDayDocuments();

            $timeout(gotoMyRequests(), 2000);
        } else {
            $scope.modal.title = "Unable to Submit";
            $scope.modal.body = "You need to save the Vacation Request before you submit it.";
            $scope.modal.buttons = [];
            var button1 = {};
            button1.label = "OK";
            button1.callback = "";
            $scope.modal.buttons.push(button1);
            $('#myModal').modal('show');
        }
    }

    //TODO: update Vacation Profile Hours here cancel
    function cancelVacationRequest(){
        promptForComments("Reasons for Canceling Request", "cancel");
    }

    //TODO: update Vacation Profile Hours here approve
    function approveVacationRequest(){
        var data = {
            'STATUS': "Approved"
        };


        $http.patch(dataPUT + $rootScope.vacationRequest.unid + "?form=Vacation%20Request", data).then(function (response) {
            // console.log(response);
            gotoMyRequests();
        });


    }

    //TODO: update Vacation Profile Hours here rejected
    function rejectVacationRequest(){
        promptForComments("Reasons for Rejecting Request", "reject");
    }
    
    function promptForComments(title, type){
        $scope.modal.title = title;
        $scope.modal.type = type;
        //$scope.modal.body = "You need to save the Vacation Request before you submit it.";
        // $scope.modal.buttons = [];
        // var button1 = {};
        // button1.label = "OK";
        // button1.callback = "";
        // $scope.modal.buttons.push(button1);
        $('#commentsModal').modal('show');
    }


    function deleteVacationRequest(){

        //get all existing day documents for this request and delete them
        var vacationDaysRequestString = vacationDaysbyIDURL + "?keys=" + $rootScope.vacationRequest.requestID + "&keysexactmatch=true";
        $http.get(vacationDaysRequestString).
        success(function(data){

            var arrUNID = [];
            for(var i = 0; i < data.length; i++){
                arrUNID.push(data[i][unidStr]);
            }

            for (var j=0; j < arrUNID.length; j++){
                var deleteString = dataPUT + "/" + arrUNID[j];
                $http.delete(deleteString).
                success(function(data){

                }).
                error(function(data, status, headers, config){

                });
            }

        }).
        error(function(data,status,headers,config){

        });

        //Delete the vacation request document
        var deleteString = dataPUT + "/" + $rootScope.vacationRequest.unid;
        $http.delete(deleteString).then(function (response) {
            // console.log(response);
            $timeout(gotoMyRequests(), 2000);
        });
    }

    function cancelComments(){
        $('#commentsModal').modal('hide');
    }

    function hasComments(){
        if ($scope.comments == null){
            return false;
        } else {
            return true;
        }
    }

    function addComments() {


        if ($scope.comments != null) {

            var currUser = $rootScope.empName;
            var currDateTime = currentDateTime();
            var combinedComments;
            if ($rootScope.vacationRequest.requestComments != "") {
                var currComments = $rootScope.vacationRequest.requestComments;
                var newComments = "\n" + currUser + ": " + $scope.comments;
                combinedComments = currComments.concat(newComments);
            } else {
                combinedComments = currUser + " " + currDateTime + ": " + $scope.comments;
            }


            var type = $scope.modal.type;
            var data;

            switch (type) {
                case "cancel":

                    data = {
                        'STATUS': "Canceled",
                        'requestComments': combinedComments
                    };
                    break;

                case "reject":

                    data = {
                        'STATUS': "Rejected",
                        'requestComments': combinedComments
                    };
                    break;

                default:

                    break;
            }
            $http.patch(dataPUT + $rootScope.vacationRequest.unid + "?form=Vacation%20Request", data).then(function (response) {
                // console.log(response);
            });

            $('#commentsModal').modal('hide');
            gotoMyRequests();
        }
    }

    function isSaved(){
        var saved = $rootScope.vacationRequest.unid;
        if(saved != null){
            return true;
        } else {
            return false;
        }
    }

    function isProcessing(){
        return $scope.processing;
    }

    function isSubmitted(){
        var currStatus = $rootScope.vacationRequest.status;

        if (currStatus == "Submitted") {
            return true;
        } else {
            return false;
        }
    }
    
    function isNew(){
        var currStatus = $rootScope.vacationRequest.status;
        if (currStatus == "New" || currStatus == null) {
            return true;
        } else {
            return false;
        }
    }

    function isTaken(){
        var currStatus = $rootScope.vacationRequest.status;
        if (currStatus == "Taken") {
            return true;
        } else {
            return false;
        }
    }

    function isCanceled(){
        var currStatus = $rootScope.vacationRequest.status;
        if (currStatus == "Canceled") {
            return true;
        } else {
            return false;
        }
    }

    function isApprover(){
        // var currUser = $rootScope.empNotesName;
        // if($rootScope.vacationRequest.approvers.length > 1){
        //     for (var i=0; i < $rootScope.vacationRequest.approvers.length; i++){
        //        if($rootScope.vacationRequest.approvers[i] == currUser){
        //            return true;
        //        }
        //     }
        //     return false;
        // } else{
        //     if ($rootScope.vacationRequest.approvers == currUser){
        //         return true;
        //     } else {
        //         return false;
        //     }
        // }

        //THIS IS FOR DEMO/TESTING PURPOSES ONLY
        return true;

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
        var u = $rootScope.empNotesName;
        var requestString = vacationProfileURL + "?keys=" + u + "&keysexactmatch=true";
        $http.get(requestString).
        success(function(data) {
            $rootScope.vacationProfile = data;
            $rootScope.groupName = data[0].Group;
            getUserGroup();
            getVacationRequestsByGroup(data[0].Group);


        }).
        error(function(data, status, headers, config) {
            // log error
        });
    }

    //TODO: Update the hours on a vacation profile
    function updateVacationProfile(year, hoursSubmitted, hoursApproved, hoursRejected, hourscanceled){

        // for(var i = 0; i < $rootScope.vacationProfile.length; i++){
        //
        // }

        // $http.patch(dataPUT + $rootScope.vacationRequest.unid + "?form=Vacation%20Request", data).then(function (response) {
        //     console.log(response);
        // });
    }


    function getMyVacationRequests(){
        var u = $rootScope.empNotesName;
        var requestString = vacationRequestsURL + "?keys=" + u + "&keysexactmatch=true";
        $http.get(requestString).
        success(function(data) {
            $rootScope.myVacationRequests = data;
        }).
        error(function(data, status, headers, config) {
            // log error
        });
    }

    //TODO: Change this back to find the current empNotesName
    function getMyVacationRequestsToApprove(){
        //var u = $rootScope.empNotesName;
        var u = "CN=Nick Coccagna/O=TPJ";
        var requestString = vacationRequestsbyApproverURL + "?keys=" + u + "&keysexactmatch=true";
        $http.get(requestString).
        success(function(data) {
            $rootScope.myVacationRequestsToApprove = data;
        }).
        error(function(data, status, headers, config) {
            // log error
        });
    }


    function getVacationRequestsByGroup(group){


        var requestString = vacationRequestsbyGroupURL + "?keys=" + group + "&keysexactmatch=true";
        console.log(requestString);
        $http.get(requestString).
        success(function(data) {
            $rootScope.groupVacationRequests = data;
            
            var eventArray = [{}];
            eventArray.shift();

            //TODO: Each event needs to be its own bubble
            //NOTES: You will need to get the dates associated with this request and make them their own event
            // bubbles. Maybe we want to store an array of the dates on the request rather than having to look up
            // the dates?
            for(var i = 0; i < data.length; i++){
                var newEvent = {};
                newEvent.title = data[i].empName;
                newEvent.start = new Date(data[i].startDate);
                var tmpEnd = new Date(data[i].endDate);
                newEvent.end = tmpEnd.setDate(tmpEnd.getDate() + 1);
                newEvent.allDay = true;
                //newEvent.color = "purple";
                // $('#calendar').fullCalendar( 'renderEvent', newEvent );
                eventArray.push(newEvent);
            }
            // console.log("length: " + eventArray.length);
            $scope.events = eventArray;


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


        }).
        error(function(data, status, headers, config) {
            // log error
        });

    }


    function getUnidOfVacationRequest(id){
        var requestString = vacationRequestsbyIDURL + "?keys=" + id + "&keysexactmatch=true";
        $http.get(requestString).
        success(function(data) {

            $rootScope.vacationRequest.unid = data[0][unidStr];

        }).
        error(function(data, status, headers, config) {
            // log error
        });

        // console.log($rootScope);
    }

    function getRequest(id){
        var requestString = vacationRequestsbyIDURL + "?keys=" + id + "&keysexactmatch=true";
        $http.get(requestString).
        success(function(data) {
            // console.log(data);
            $rootScope.vacationRequest.empName = data[0].empName;
            $rootScope.vacationRequest.startDate = new Date(data[0].startDate);
            $rootScope.vacationRequest.endDate = new Date(data[0].endDate);
            $rootScope.vacationRequest.status = data[0].STATUS;
            $rootScope.vacationRequest.empNotesName = data[0].EMPNOTESNAME;
            $rootScope.vacationRequest.hoursThisRequest = data[0].hoursThisRequest;
            $rootScope.vacationRequest.approvers = data[0].approvers;
            $rootScope.vacationRequest.requestComments = data[0].requestComments;
            $rootScope.vacationRequest.groupName = data[0].GroupName;
            $rootScope.vacationRequest.requestID = data[0].requestID;
            $rootScope.vacationRequest.unid = data[0][unidStr];

            var dateArray;
            dateArray = getDates($rootScope.vacationRequest.startDate, $rootScope.vacationRequest.endDate);
            //get the weekdays from the dateArray and store them in this array.
            var vacationDays = [];
            var arrayLength = dateArray.length;
            for (var i = 0; i < arrayLength; i++){
                var selectedDate = dateArray[i];
                var day = selectedDate.getDay();
                if (day != 0 && day != 6) {
                    vacationDays.push(selectedDate);
                }
            }


            // Now that we have the dates, dynamically create the form.

            //lets format the dates..
            var formattedVacationDays = [];
            for (var x = 0; x < vacationDays.length; x++){
                var formattedDate = dateFormat(vacationDays[x], "fullDate");
                formattedVacationDays.push(formattedDate);
            }


            var vacationDaysRequestString = vacationDaysbyIDURL + "?keys=" + $rootScope.vacationRequest.requestID + "&keysexactmatch=true";

            $http.get(vacationDaysRequestString).
                success(function(data){

                $rootScope.vacationRequest.requestedDates.shift();
                for(var i = 0; i < data.length; i++){
                    var tmpData = {
                        'empName': data[i].empName,
                        'name': data[i].name,
                        'value': data[i].value,
                        'lookupKey': data[i].lookupKey,
                        'unid': data[i][unidStr]
                    };
                    $rootScope.vacationRequest.requestedDates.push(tmpData);
                    $rootScope.vacationRequest.dayUNID.push(data[i][unidStr]);
                }

            }).
                error(function(data,status,headers,config){

            });


        }).
        error(function(data, status, headers, config) {
            // log error
        });

        // console.log($rootScope);
    }

    function openRequest(id){
        $window.location.href = "requestForm.html?open&uid=" + id;
    }



    // function recalculateDates(){
    //
    //     if(isRequestValid() == true) {
    //         $rootScope.vacationRequest.requestedDates = [{}];
    //         $rootScope.vacationRequest.requestedDates.shift();
    //         $rootScope.vacationRequest.hoursThisRequest = 0;
    //
    //         //we need to gather all of the days that aren't weekends and store them in an array
    //         var dateArray;
    //         var startDate = $rootScope.vacationRequest.startDate;
    //         var endDate = $rootScope.vacationRequest.endDate;
    //         dateArray = getDates(startDate, endDate);
    //
    //         $rootScope.vacationRequest.startDate = startDate;
    //         $rootScope.vacationRequest.endDate = endDate;
    //
    //
    //         //get the weekdays from the dateArray and store them in this array.
    //         var vacationDays = [];
    //         var arrayLength = dateArray.length;
    //         for (var i = 0; i < arrayLength; i++) {
    //             var selectedDate = dateArray[i];
    //             var day = selectedDate.getDay();
    //             if (day != 0 && day != 6) {
    //                 vacationDays.push(selectedDate);
    //             }
    //         }
    //
    //         // Now that we have the dates, dynamically create the form.
    //
    //         //lets format the dates..
    //         var formattedVacationDays = [];
    //         for (var x = 0; x < vacationDays.length; x++) {
    //             var formattedDate = dateFormat(vacationDays[x], "fullDate");
    //             formattedVacationDays.push(formattedDate);
    //         }
    //
    //         //for each date, add to our array of objects
    //         for (var j = 0; j < formattedVacationDays.length; j++) {
    //             var tmpObject = {
    //                 "name": formattedVacationDays[j],
    //                 "value": "Whole"
    //             }
    //             $rootScope.vacationRequest.requestedDates.push(tmpObject);
    //         }
    //         $rootScope.vacationRequest.hoursThisRequest = $rootScope.vacationRequest.requestedDates.length * 8;
    //     }
    // }


    function recalculateHours(){
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

    }

    function gotoMyRequests(){
        $window.location.href = "myRequests.html";
    }

    function closeVacationRequest(){
        //check to see if the form is saved first
        

        $window.location.href = "myRequests.html";
    }


    function isRequestValid(){
        var startDate = $rootScope.vacationRequest.startDate;
        var endDate = $rootScope.vacationRequest.endDate;

        if (startDate == null){
            $scope.modal.title = "Field Validation Error";
            $scope.modal.body = "The Start Date cannot be blank.";
            $scope.modal.buttons = [];
            var button1 = {};
            button1.label = "OK";
            button1.callback = "";
            $scope.modal.buttons.push(button1);
            $('#myModal').modal('show');
            return false;
        } else if (endDate == null){
            $scope.modal.title = "Field Validation Error";
            $scope.modal.body = "The End Date cannot be blank.";
            $scope.modal.buttons = [];
            var button1 = {};
            button1.label = "OK";
            button1.callback = "";
            $scope.modal.buttons.push(button1);
            $('#myModal').modal('show');
            return false;
        } else if (startDate > endDate) {
            $scope.modal.title = "Field Validation Error";
            $scope.modal.body = "The Start Date cannot come after the End Date.";
            $scope.modal.buttons = [];
            var button1 = {};
            button1.label = "OK";
            button1.callback = "";
            $scope.modal.buttons.push(button1);
            $('#myModal').modal('show');
            return false;
        } else {
            return true;
        }

    }


    function isReadyToSubmit(requestID){
        //get the request to see if it has a UNID - AKA: has it been saved first
        var requestString = vacationRequestsbyIDURL + "?keys=" + requestID + "&keysexactmatch=true";
        $http.get(requestString).
        success(function(data) {
            // console.log(data);
            // $rootScope.vacationRequest.unid = data[0][unidStr];
            var tmpUNID = data[0][unidStr];
            if (tmpUNID != null){
                  return true;
            } else {
                   return false;
            }
        }).
        error(function(data, status, headers, config) {
            // log error
            // console.log(data, status, headers, config);
            // console.log("ERROR");
            return false;
        });

        // console.log("WE SHOULD NEVER GET HERE");
    }


    function containsDate(obj, list) {
        var i;
        for (i = 0; i < list.length; i++) {
            if (list[i].name === obj.name) {
                return true;
            }
        }

        return false;
    }

    function convertStrToDate(strDate){
        return strDate.substr(strDate.indexOf(",") + 1);
    }


//     // *********************************************
//     // Angular Calendar
//     // *********************************************
    var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();
    $scope.eventSource = {
        // url: "http://www.google.com/calendar/feeds/usa__en%40holiday.calendar.google.com/public/basic",
        // className: 'gcal-event',           // an option!
        // currentTimezone: 'America/Chicago' // an option!
    };


    /* event source that calls a function on every view switch */
    $scope.eventsF = function (start, end, timezone, callback) {
        var s = new Date(start).getTime() / 1000;
        var e = new Date(end).getTime() / 1000;
        var m = new Date(start).getMonth();
        var events = [{title: 'Feed Me ' + m,start: s + (50000),end: s + (100000),allDay: false, className: ['customFeed']}];
        callback(events);
    };

    /* alert on eventClick */
    $scope.alertOnEventClick = function( date, jsEvent, view){
        $scope.alertMessage = (date.title + ' was clicked ');
        alert($scope.alertMessage);
    };

    $scope.consoleOnEventClick = function( date, jsEvent, view){
        console.log(date);
    };
    /* alert on Drop */
    $scope.alertOnDrop = function(event, delta, revertFunc, jsEvent, ui, view){
        $scope.alertMessage = ('Event Dropped to make dayDelta ' + delta);
    };
    /* alert on Resize */
    $scope.alertOnResize = function(event, delta, revertFunc, jsEvent, ui, view ){
        $scope.alertMessage = ('Event Resized to make dayDelta ' + delta);
    };
    /* add and removes an event source of choice */
    $scope.addRemoveEventSource = function(sources,source) {
        var canAdd = 0;
        angular.forEach(sources,function(value, key){
            if(sources[key] === source){
                sources.splice(key,1);
                canAdd = 1;
            }
        });
        if(canAdd === 0){
            sources.push(source);
        }
    };
    /* add custom event*/
    $scope.addEvent = function() {
        $scope.events.push({
            title: 'Open Sesame',
            start: new Date(y, m, 28),
            end: new Date(y, m, 29),
            className: ['openSesame']
        });
    };
    /* remove event */
    $scope.remove = function(index) {
        $scope.events.splice(index,1);
    };
    /* Change View */
    $scope.changeView = function(view,calendar) {
        uiCalendarConfig.calendars[calendar].fullCalendar('changeView',view);
    };
    /* Change View */
    $scope.renderCalender = function(calendar) {
        $timeout(function() {
            if(uiCalendarConfig.calendars[calendar]){
                uiCalendarConfig.calendars[calendar].fullCalendar('render');
            }
        });
    };
    /* Render Tooltip */
    $scope.eventRender = function( event, element, view ) {
        element.attr({'tooltip': event.title,
            'tooltip-append-to-body': true});
        $compile(element)($scope);
    };
    /* config object */
    $scope.uiConfig = {
        approverCalendar:{
            editable: false,
            selectable: false,
            unselectAuto: false,
            selectHelper: true,
            eventLimit: true,
            businessHours: true,
            header:{
                left: 'prev,next today',
                center: 'title',
                right: 'month,basicWeek,basicDay'
            },
            eventClick: $scope.alertOnEventClick,
            eventDrop: $scope.alertOnDrop,
            eventResize: $scope.alertOnResize,
            eventRender: $scope.eventRender
        },
        groupCalendar:{
            editable: false,
            selectable: false,
            unselectAuto: false,
            selectHelper: true,
            eventLimit: true,
            businessHours: true,
            header:{
                left: 'prev,next today',
                center: 'title',
                right: 'month,basicWeek,basicDay'
            },
            eventClick: $scope.alertOnEventClick,
            eventDrop: $scope.alertOnDrop,
            eventResize: $scope.alertOnResize,
            eventRender: $scope.eventRender
        },
        readFormCalendar:{
            editable: false,
            selectable: false,
            unselectAuto: false,
            selectHelper: true,
            eventLimit: true,
            businessHours: true,
            header:{
                left: 'prev,next today',
                center: 'title',
                right: 'month'
            },
            //eventClick: $scope.alertOnEventClick,
            eventDrop: $scope.alertOnDrop,
            eventResize: $scope.alertOnResize,
            eventRender: $scope.eventRender
        },
        editFormCalendar:{
            editable: false,
            selectable: true,
            unselectAuto: false,
            selectHelper: true,
            eventLimit: true,
            businessHours: true,
            header:{
                left: 'prev,next today',
                center: 'title',
                right: 'month'
            },
            //eventClick: $scope.alertOnEventClick,
            eventDrop: $scope.alertOnDrop,
            eventResize: $scope.alertOnResize,
            eventRender: $scope.eventRender,


            select: function(start, end){

                //we need to gather all of the days that aren't weekends or holidays and store them in an array
                var dateArray;
                var startDate = new Date(start.format());
                var endDate = new Date(end.format());


                startDate.setDate(startDate.getDate()+1);
                dateArray = getDates(startDate, endDate);

                // $rootScope.vacationRequest.startDate = startDate;
                // $rootScope.vacationRequest.endDate = endDate;



                //get the weekdays from the dateArray and store them in this array.
                var vacationDays = [];
                var arrayLength = dateArray.length;
                for (var i = 0; i < arrayLength; i++){
                    var selectedDate = dateArray[i];
                    var day = selectedDate.getDay();
                    if (day != 0 && day != 6) {
                        vacationDays.push(selectedDate);
                    }
                }

//                    console.log(dateArray);
//                    console.log(vacationDays);

                // Now that we have the dates, dynamically create the form.

                //lets format the dates..
                var formattedVacationDays = [];
                for (var x = 0; x < vacationDays.length; x++){
                    var formattedDate = dateFormat(vacationDays[x], "fullDate");
                    formattedVacationDays.push(formattedDate);
                }

                //for each date, add to our array of objects
                for(var j = 0; j < formattedVacationDays.length; j++){
                    var tmpObject = {
                        "name": formattedVacationDays[j],
                        "value": "Whole"
                    };

                    var objExists = containsDate(tmpObject,$rootScope.vacationRequest.requestedDates);

                    if (objExists == false){
                        $rootScope.vacationRequest.requestedDates.push(tmpObject);
                    }


                }
                var tmpRequestDates = $rootScope.vacationRequest.requestedDates;


                tmpRequestDates.sort(function(a,b) {
                    var date1 = new Date(a.name);
                    var date2 = new Date(b.name);

                    if (date1 < date2){
                        return -1;
                    }
                    if (date1 > date2){
                        return 1;
                    }
                });

                //TODO: We don't have to actually do this conversion since there can be gaps

                $rootScope.vacationRequest.requestedDates = tmpRequestDates;
                $rootScope.vacationRequest.hoursThisRequest = $rootScope.vacationRequest.requestedDates.length * 8;

                console.log(tmpRequestDates);
                var length = tmpRequestDates.length;
                var tmpStartDate = new Date(convertStrToDate(tmpRequestDates[0].name));
                var tmpEndDate = new Date(convertStrToDate(tmpRequestDates[length-1].name));

                $rootScope.vacationRequest.startDate = tmpStartDate;
                $rootScope.vacationRequest.endDate = tmpEndDate;

            }
        }
    };

    $scope.eventSources = [$scope.events, $scope.eventSource, $scope.eventsF];
    $scope.eventSources2 = [$scope.calEventsExt, $scope.eventsF, $scope.events];



}