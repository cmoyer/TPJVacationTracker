/**
 * Created by chad on 4/25/16.
 */

var main = angular.module('main', ['ngMessages','ui.calendar', 'ngRoute','ng.group','angularUUID2'])
    .controller('mainCtrl',['$rootScope','$scope', '$location', '$http', '$compile', '$q','$timeout','$window', 'uuid2', MainCtrl]);
var domainURL = '//www.pjdick.com';
var dataURL = domainURL + '/VacationTracker.nsf';
var recordLockURL = domainURL + '/VacationTracker.nsf/api/data/documents';
var dataPOST = domainURL + '/VacationTracker.nsf/api/data/documents';
var dataPUT = domainURL + '/VacationTracker.nsf/api/data/documents/unid/';
var getLocksURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/LockedRecords';
var getGroupURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/GroupsREST';
var getGroupByApproverURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/GroupsByApproverREST';
var sysdefURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/SystemDefaults';
var vacationProfileURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/VacationProfilesREST';
var vacationRequestsbyIDURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/VacationRequestsbyIDREST';
var vacationRequestsbyGroupURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/VacationRequestsbyGroupREST';
var vacationRequestsbyApproverURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/VacationRequestsbyApproverREST';
var vacationDaysbyIDURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/VacationDaysbyIDREST';
var vacationDaysbyEMPURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/VacationDaysbyEMPREST';
var vacationRequestsURL = domainURL + '/VacationTracker.nsf/api/data/collections/name/VacationRequestsREST';
var holidayURL = domainURL + '/TimeTracking.nsf/api/data/collections/name/HolidaysREST';
var empURL = domainURL + '/Employee.nsf/api/data/collections/name/EmpRest';
var dsMaxCount = 100; // the maximum count for the Domino data services
var unidStr = "@unid";

function MainCtrl($rootScope, $scope, $location, $http, $compile, $q, $timeout, $window, uuid2){



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
    $scope.promptWithProfileDialog = false;

 
    $scope.getVacationProfile = getVacationProfile;
    $scope.getMyVacationRequests = getMyVacationRequests;
    $scope.getMyVacationRequestsToApprove = getMyVacationRequestsToApprove;
    $scope.getVacationRequestsByGroup = getVacationRequestsByGroup;
    $scope.getVacationRequestsByGroupForMonth = getVacationRequestsByGroupForMonth;
    $scope.updateVacationProfile = updateVacationProfile;
    $scope.getRequest = getRequest;
    $scope.openRequest = openRequest;
    $scope.recalculateHours = recalculateHours;
    $scope.addComments = addComments;
    $scope.hasComments = hasComments;
    $scope.requestHasComments = requestHasComments;
    $scope.promptForComments = promptForComments;
    $scope.cancelComments = cancelComments;
    $scope.testSendMemo = testSendMemo;
    $scope.testGetUsersCalendar = testGetUsersCalendar;
    $scope.addVacationToNotesCalendar = addVacationToNotesCalendar;
    var ismobi = navigator.userAgent.match(/Mobi/i);

    // Hide/When functions
    $scope.isNew = isNew;
    $scope.isSaved = isSaved;
    $scope.isSubmitted = isSubmitted;
    $scope.isApproved = isApproved;
    $scope.isTaken = isTaken;
    $scope.isRejected = isRejected;
    $scope.isApprover = isApprover;
    $scope.isCancelled = isCancelled;

    // Saving and Status Changes of Requests
    $scope.saveVacationRequest = saveVacationRequest;
    $scope.submitVacationRequest = submitVacationRequest;
    $scope.isReadyToSubmit = isReadyToSubmit;
    $scope.approveVacationRequest = approveVacationRequest;
    $scope.rejectVacationRequest = rejectVacationRequest;
    $scope.cancelVacationRequest = cancelVacationRequest;
    $scope.closeVacationRequest = closeVacationRequest;
    $scope.deleteVacationRequest = deleteVacationRequest;
    $scope.createVacationDayDocuments = createVacationDayDocuments;
    $scope.deleteVacationDays = deleteVacationDays;
    $scope.clearDateFromRequest = clearDateFromRequest;
    $scope.adminClearDateFromRequest = adminClearDateFromRequest;
    $scope.adminTakenRequest = adminTakenRequest;
    $scope.hideTotalHours = hideTotalHours;
    $scope.hideStatus = hideStatus;

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
        $rootScope.myVacationRequestsByYear = [{}];
        $rootScope.myVacationRequestsToApprove = {};
        $rootScope.groupVacationRequests = {};
        $rootScope.holidayList = {};
        $scope.userGroups = [];
        $scope.selectedGroup = "";
        $rootScope.vacationRequest.requestComments = "";
        $rootScope.vacationRequest.requestedDates = [{}];
        $rootScope.vacationRequest.requestedDates.shift();
        $rootScope.vacationRequest.dayUNID = [];
        $rootScope.Answers = {};
        $rootScope.group = {};
        $scope.events = [];
        $scope.holidays = [];
        $rootScope.clickedRequest = {};
        $scope.modalResponse = "none";
        $scope.modal = {};
        $scope.modal.buttons = [];


        if(ismobi == null){
            $scope.isMobileDevice = false;
        } else{
            $scope.isMobileDevice = true;
        }
        

        // on load of the page, get the information for the currently authenticated user
        getUserData();

        // on load of the page, get the System Defaults data
        getSystemDefaults();

        // on load of the page, get the Holiday List from Time Tracking
        getHolidayList();

        if ($scope.uid != null) {
            getRequest($scope.uid);
        }

        
        // //Update the Calendars
        $rootScope.$watch('groupVacationRequests', function(value) {
            if (value != null){
                //Update all of the calendars
                $('#calendar').fullCalendar( 'removeEventSource', $scope.eventSources3);
                $('#calendar').fullCalendar( 'addEventSource', $scope.eventSources3);
                $('#calendar').fullCalendar( 'refetchEvents' );

                // console.log($scope);
            }
        });

        $rootScope.$watch('groupName', function(value) {
           if (value != null){
               getVacationRequestsByGroupForMonth(value, $scope.monthStart, $scope.monthEnd);
           }
        });


        console.log($rootScope);
        console.log($scope);

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

            var eventArray = [{}];
            eventArray.shift();

            //NOTES: You will need to get the dates associated with this request and make them their own event
            // bubbles. Maybe we want to store an array of the dates on the request rather than having to look up
            // the dates?
            for(var i = 0; i < $rootScope.holidayList.length; i++){
                var dateString = StrLeft(data[i].HolidayDate, "T");
                var tmpDate = new Date(dateString);
                var theDate = tmpDate.setDate(tmpDate.getDate());
                $scope.holidays.push({
                    title: data[i].HolidayName,
                    start: theDate,
                    end: theDate,
                    allDay: true,
                    color: '#DAF8DD',
                    textColor: 'black',
                    stick: true
                });
            }

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
            getMyVacationRequestsByYear();
            getMyVacationRequestsToApprove();

        }).
        error(function(data, status, headers, config) {

        });
    }

    function logoutUser(){
        //log the current user out and then redirect them
        var redirectURL = "https://www.pjdick.com/tpjwebsite.nsf/TPJVacationTrackerLogout?openPage";
        window.location = "//www.pjdick.com/VacationTracker.nsf" + "?Logout&RedirectTo=" + redirectURL;
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

    function createVacationDayDocuments(empNotesName, status){

        var defer = $q.defer();


        //if the doc has been created, update, else, post
        for (var i=0; i < $rootScope.vacationRequest.requestedDates.length; i++){
            var docExists = false;

            var tmpData = {
                'empName': $rootScope.vacationRequest.empName,
                'name': $rootScope.vacationRequest.requestedDates[i].name,
                'value': $rootScope.vacationRequest.requestedDates[i].value,
                'EMPNOTESNAME': empNotesName,
                'STATUS': status,
                'lookupKey': $rootScope.vacationRequest.requestID
            };

            for(var j=0; j < $rootScope.vacationRequest.requestedDates.length; j++){
                if ($rootScope.vacationRequest.requestedDates[j].name == tmpData.name && $rootScope.vacationRequest.requestedDates[j].unid != null){
                    docExists = true;
                }
            }

            if (docExists == true){
                var putStr = dataPUT + $rootScope.vacationRequest.requestedDates[i].unid;
                $http.put(putStr, tmpData).then(function (response){

                });
            } else {
                $http.post(dataPOST + "?form=Vacation%20Day", tmpData).then(function (response) {

                });
            }


        }
        defer.resolve();
        return defer.promise;
    }

    function saveVacationRequestWhenTaken(){
        var numberOfDays = $rootScope.vacationRequest.requestedDates.length;

        var datesThisRequest = [];
        var datesStr = "";

        for(var i=0; i < $rootScope.vacationRequest.requestedDates.length; i++){
            var tmpDate= new Date(convertStrToDate($rootScope.vacationRequest.requestedDates[i].name));
            datesThisRequest.push(tmpDate.format("mm/dd/yyyy"));

            if(datesStr == ""){
                datesStr = tmpDate.format("mm/dd/yyyy").toString();
            } else {
                datesStr = datesStr.concat(', ' + tmpDate.format("mm/dd/yyyy").toString())
            }

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
            'numberOfDays': numberOfDays,
            'datesThisRequest': datesStr,
            'arrDatesThisRequest':datesThisRequest
            // 'requestedDates': $rootScope.vacationRequest.requestedDates
        };


        // console.log(data);
        $http.patch(dataPUT + $rootScope.vacationRequest.unid + "?form=Vacation%20Request", data).then(function (response){
            $timeout( function(){ $scope.openRequest($rootScope.vacationRequest.requestID); }, 200);
        });
        
    }

    function saveVacationRequest(){

        // var myFirstDeferred = $q.defer();

        $rootScope.vacationRequest.date = currentDate();
        if ($rootScope.vacationRequest.status == null){
            $rootScope.vacationRequest.status = "New";
        }

        if($rootScope.vacationRequest.empName == null){
            $rootScope.vacationRequest.empName = $rootScope.empName;
        }

        if($rootScope.vacationRequest.empNotesName == null){
            $rootScope.vacationRequest.empNotesName = $rootScope.empNotesName;
        }

        // alert($rootScope.groupName);
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


            var numberOfDays = $rootScope.vacationRequest.requestedDates.length;

            var datesThisRequest = [];
            var datesStr = "";

            for(var i=0; i < $rootScope.vacationRequest.requestedDates.length; i++){
                var tmpDate= new Date(convertStrToDate($rootScope.vacationRequest.requestedDates[i].name));
                datesThisRequest.push(tmpDate.format("mm/dd/yyyy"));

                if(datesStr == ""){
                    datesStr = tmpDate.format("mm/dd/yyyy").toString();
                } else {
                    datesStr = datesStr.concat(', ' + tmpDate.format("mm/dd/yyyy").toString())
                }

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
                'numberOfDays': numberOfDays,
                'datesThisRequest': datesStr,
                'arrDatesThisRequest':datesThisRequest
                // 'requestedDates': $rootScope.vacationRequest.requestedDates
            };

            // console.log(data);
            if($rootScope.vacationRequest.unid == null) {
                $http.post(dataPOST + "?form=Vacation%20Request", data).then(function (response) {
                    // console.log(response)
                });
            } else {

                $http.patch(dataPUT + $rootScope.vacationRequest.unid + "?form=Vacation%20Request", data).then(function (response){
                    // console.log(response)
                });
            }

            createVacationDayDocuments($rootScope.vacationRequest.empNotesName, "New")
                .then(function(){
                    // THIS NEEDS TO BE HERE TO GET THE UNID OF THE LOTUS DOCUMENT BECAUSE WE ARE NO LONGER CLOSING THE FORM.
                    $timeout( function(){ $scope.openRequest($rootScope.vacationRequest.requestID); }, 200);
                })
                .error(function(){
                    $timeout( function(){ $scope.openRequest($rootScope.vacationRequest.requestID); }, 200);
                });
        }


    }

    function createVacationProfile(year, empNotesName, nextYearsHours){
        //create a profile request document that we will have an agent pick up, pass to our "CreateNextYear's
        // Profile agent

        var data = {
            'empNotesName': empNotesName,
            'year': year,
            'hours': nextYearsHours
        };

        $http.post(dataPOST + "?form=Profile%20Request", data).then(function (response) {
            // console.log(response)
        });



    }

    function hideTotalHours(hours){
        if (hours == "0"){
            return true;
        } else {
            return false;
        }
    }

    function hideStatus(status){
        if (status == null){
            return true;
        } else {
            return false;
        }
    }

    function getHoursForEachYear(requestedDates, status){
        var thisYearsHours = 0;
        var nextYearsHours = 0;
        var currentdate = new Date();
        var thisYear = currentdate.getFullYear();
        var nextYear = thisYear + 1;
        var tmpHours;

        // check to see which years are included in this request
        for (var i=0; i < requestedDates.length; i++){
            var selectedDate = new Date(convertStrToDate(requestedDates[i].name));
            var selectedYear = selectedDate.getFullYear();

            if (requestedDates[i].value == "Full Day"){
                tmpHours = 8;
            } else {
                tmpHours = 4;
            }

            if (selectedYear == thisYear){
                thisYearsHours += tmpHours;
            } else if(selectedYear == nextYear){
                nextYearsHours += tmpHours;
            }
        }

        switch (status) {
            case "Submitted":
                if (thisYearsHours != 0){
                    updateVacationProfile(thisYear, thisYearsHours, 0, 0);

                    if ($scope.promptWithProfileDialog == true){
                        $scope.modal.title = "Vacation Profile Request Submitted";
                        $scope.modal.body = "Please allow 5 - 10 minutes for the system to update your " + nextYear + " vacation" +
                            " profile.";
                        $scope.modal.buttons = [];
                        var button1 = {};
                        button1.label = "OK";
                        button1.callback = "";
                        $scope.modal.buttons.push(button1);
                        $('#vacationProfileModal').modal('show');
                    } else {
                        $timeout(gotoMyRequests(), 2000);
                    }
                }

                if (nextYearsHours != 0){
                    updateVacationProfile(nextYear, nextYearsHours, 0, 0);
                    if ($scope.promptWithProfileDialog == true){
                        $scope.modal.title = "Vacation Profile Request Submitted";
                        $scope.modal.body = "Please allow 5 - 10 minutes for the system to update your " + nextYear + " vacation" +
                            " profile.";
                        $scope.modal.buttons = [];
                        var button1 = {};
                        button1.label = "OK";
                        button1.callback = "";
                        $scope.modal.buttons.push(button1);
                        $('#vacationProfileModal').modal('show');
                    } else {
                        $timeout(gotoMyRequests(), 2000);
                    }
                }
                break;

            case "Approved":
                if (thisYearsHours != 0){
                    updateVacationProfile(thisYear, -thisYearsHours, thisYearsHours, thisYearsHours);
                    $timeout(gotoMyApprovals(), 2000);
                }

                if (nextYearsHours != 0){
                    updateVacationProfile(nextYear, -thisYearsHours, nextYearsHours, nextYearsHours);
                    $timeout(gotoMyApprovals(), 2000);
                }
                break;

            case "Rejected":
                if (thisYearsHours != 0){
                    updateVacationProfile(thisYear, -thisYearsHours, 0, thisYearsHours);
                    $timeout(gotoMyApprovals(), 2000);
                }

                if (nextYearsHours != 0){
                    updateVacationProfile(nextYear, -nextYearsHours, 0, nextYearsHours);
                    $timeout(gotoMyApprovals(), 2000);
                }
                break;

            case "Cancelled":
                if (thisYearsHours != 0){
                    if($rootScope.vacationRequest.status == "Submitted"){
                        updateVacationProfile(thisYear, -thisYearsHours, 0, thisYearsHours);
                        $timeout(gotoMyRequests(), 2000);
                    } else {
                        updateVacationProfile(thisYear, 0, -thisYearsHours, thisYearsHours);
                        $timeout(gotoMyRequests(), 2000);
                    }

                }

                if (nextYearsHours != 0){
                    if($rootScope.vacationRequest.status == "Submitted"){
                        updateVacationProfile(nextYear, -nextYearsHours, 0, nextYearsHours);
                        $timeout(gotoMyRequests(), 2000);
                    } else {
                        updateVacationProfile(nextYear, 0, -nextYearsHours, nextYearsHours);
                        $timeout(gotoMyRequests(), 2000);
                    }

                }
                break;
        }


    }
    function checkForOverage(requestedDates){
        var thisYearsHours = 0;
        var nextYearsHours = 0;
        var currentdate = new Date();
        var thisYear = currentdate.getFullYear();
        var nextYear = thisYear + 1;
        var tmpHours;
        var thisYearRemaining = 0;
        var nextYearRemaining = 0;
        var overage = false;
        var ignoreNextYearOverage = false;

        // check to see which years are included in this request
        for (var i=0; i < requestedDates.length; i++){
            var selectedDate = new Date(convertStrToDate(requestedDates[i].name));
            var selectedYear = selectedDate.getFullYear();
            // var nextYear = selectedYear + 1;
            if (requestedDates[i].value == "Full Day"){
                tmpHours = 8;
            } else {
                tmpHours = 4;
            }

            if (selectedYear == thisYear){
                thisYearsHours += tmpHours;
            } else if(selectedYear == nextYear){
                nextYearsHours += tmpHours;
            }
        }

        // then check to see if the user has a vacation profile for each of those years
        var needToCreateNextYear = true;
        if (nextYearsHours > 0){
            for (var j=0; j < $rootScope.vacationProfile.length; j++){
                if($rootScope.vacationProfile[j].Year == nextYear.toString){
                    needToCreateNextYear = false;
                }
            }
        } else {
            needToCreateNextYear = false;
        }

        
        if (needToCreateNextYear == true){

            createVacationProfile(nextYear, $rootScope.empNotesName, nextYearsHours);
            ignoreNextYearOverage = true;
            $scope.promptWithProfileDialog = true;

        }



        // compare each year to the respective Vacation Profile hours remaining value
        for(var k = 0; k < $rootScope.vacationProfile.length; k++){
            switch ($rootScope.vacationProfile[k].Year) {
                case thisYear.toString():
                    thisYearRemaining = $rootScope.vacationProfile[k].HoursRemaining;
                    break;
                case nextYear.toString():
                    nextYearRemaining = $rootScope.vacationProfile[k].HoursRemaining;
                    break;
            }

        }



        if (thisYearsHours > thisYearRemaining){
            overage = true;
            $rootScope.vacationRequest.hoursOver = thisYearRemaining - thisYearsHours;
        } else if (nextYearsHours > nextYearRemaining){
            if (ignoreNextYearOverage == false){
                overage = true;
                $rootScope.vacationRequest.hoursOver = nextYearRemaining - nextYearsHours;
            }
        }

        return overage;

    }

    function checkForValidDates(requestedDates){
        var currentdate = new Date();
        var thisYear = currentdate.getFullYear();
        var nextYear = thisYear + 1;

        // check to see which years are included in this request
        for (var i=0; i < requestedDates.length; i++){
            var selectedDate = new Date(convertStrToDate(requestedDates[i].name));
            var selectedYear = selectedDate.getFullYear();
            // var nextYear = selectedYear + 1;

            if (selectedYear != thisYear & selectedYear != nextYear) {
                return false;
            }
        }

        return true;
    }

    function isReadyToSubmit(){
        var readyToSubmit = $rootScope.vacationRequest.unid;
        if (readyToSubmit != null) {
            var areDatesValid = checkForValidDates($rootScope.vacationRequest.requestedDates);
            if (areDatesValid == false){

                var currentdate = new Date();
                var thisYear = currentdate.getFullYear();
                var nextYear = thisYear + 1;

                $scope.modal.title = "Invalid Dates";
                $scope.modal.body = "You can only request dates from " + thisYear + " or " + nextYear + ".";
                $scope.modal.buttons = [];
                var button1 = {};
                button1.label = "OK";
                button1.callback = "";
                $scope.modal.buttons.push(button1);
                $('#myModal').modal('show');
            } else {
                var isOverage = checkForOverage($rootScope.vacationRequest.requestedDates);
                if (isOverage == true) {
                    $scope.modal.title = "Hours Overage";
                    $scope.modal.body = "This request exceeds your system calculated allotment.\n\nYour approver has" +
                        " been notified of this overage.";
                    $scope.modal.buttons = [];
                    var button1 = {};
                    button1.label = "OK";
                    button1.callback = "";
                    $scope.modal.buttons.push(button1);
                    $('#overageModal').modal('show');
                } else {
                    submitVacationRequest();
                }
            }

        }
    }


    function submitVacationRequest(){

        var data = {
            'STATUS': "Submitted"
        };


        $http.patch(dataPUT + $rootScope.vacationRequest.unid + "?form=Vacation%20Request", data).then(function (response) {
            // console.log(response);
        });

        // createVacationDayDocuments();
        createVacationDayDocuments($rootScope.empNotesName, "Submitted")
            .then(function(){
                $timeout( function(){
                    getHoursForEachYear($rootScope.vacationRequest.requestedDates, "Submitted");

                }, 200);
            })
            .error(function(){
                $timeout( function(){
                    getHoursForEachYear($rootScope.vacationRequest.requestedDates, "Submitted");
                }, 200);
            });
        // $timeout(getHoursForEachYear($rootScope.vacationRequest.requestedDates, "Submitted"), 2000);
    }


    function cancelVacationRequest(){
        promptForComments("Reasons for Cancelling Request", "cancel");
   }


    function adminTakenRequest(){
        var data = {
            'STATUS': "Taken"
        };


        $http.patch(dataPUT + $rootScope.vacationRequest.unid + "?form=Vacation%20Request", data).then(function (response) {
            // console.log(response);
            // gotoMyRequests();
        });


        $timeout(goBack(), 2000);
    }


    function testGetUsersCalendar(){
        getUsersMailfile("CN=Chad Moyer/O=TPJ");
    }


    function getUsersMailfile(empNotesName){
        var empRequestString =  empURL + "?keys=" + empNotesName + "&keysexactmatch=true&count=" + dsMaxCount;
        $http.get(empRequestString).
        success(function(data){
            $scope.mailfile = data[0].mailfile;
        }).
        error(function(data,status,headers,config){

        });
    }

    //TODO: addVacationToNotesCalendar
    function addVacationToNotesCalendar(){


        var testString =  "//mail1.pjdick.com/mail/cmoyer.nsf/api/calendar/events";

        $http.get(testString).
        success(function(data){
            console.log(data);
        }).
        error(function(data,status,headers,config){

        });




        // var data =  {
        //     "summary":"Appointment 1",
        //     "location":"Location 1",
        //     "start": {
        //         "date":"2016-06-06",
        //         "time":"13:00:00",
        //         "utc":true
        //     },
        //     "end": {
        //         "date":"2016-06-06",
        //         "time":"14:00:00",
        //         "utc":true
        //     }
        // };
        //
        // console.log(data);
        //
        // $http.post(testString, data).then(function (response) {
        //
        // });
        
        //	/{database}/api/calendar/events

    }

    function approveVacationRequest(){
        var currEmpNotesName = $rootScope.vacationRequest.empNotesName;
        // getUsersCalendar(currEmpNotesName);


        var data = {
            'STATUS': "Approved"
        };


        $http.patch(dataPUT + $rootScope.vacationRequest.unid + "?form=Vacation%20Request", data).then(function (response) {
            //TODO: Add this event to the user's calendar
        });

        createVacationDayDocuments(currEmpNotesName, "Approved")
            .then(function(){
                $timeout( function(){
                    getHoursForEachYear($rootScope.vacationRequest.requestedDates, "Approved");

                }, 200);
            })
            .error(function(){
                $timeout( function(){
                    getHoursForEachYear($rootScope.vacationRequest.requestedDates, "Approved");
                }, 200);
            });

    }

    function rejectVacationRequest(){
        promptForComments("Reasons for Rejecting Request", "reject");

        // getHoursForEachYear($rootScope.vacationRequest.requestedDates, "Rejected");

    }
    
    function promptForComments(title, type){
        $scope.modal.title = title;
        $scope.modal.type = type;
        $('#commentsModal').modal('show');

    }

    function deleteVacationDays(){
        var defer = $q.defer();

        //get all existing day documents for this request and delete them
        var vacationDaysRequestString = vacationDaysbyIDURL + "?keys=" + $rootScope.vacationRequest.requestID + "&keysexactmatch=true&count=" + dsMaxCount;
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

        defer.resolve();
        return defer.promise;

    }


    function deleteVacationRequest(){

        deleteVacationDays()
            .then(function(){
                //Delete the vacation request document
                var deleteString = dataPUT + "/" + $rootScope.vacationRequest.unid;
                $http.delete(deleteString).then(function (response) {
                    // console.log(response);
                    $timeout( function(){ gotoMyRequests(); }, 200);
                });
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

    function requestHasComments(){
        // This is different than hasComments()
        // hasComments() checks to see if the user entered comments into a dialog box.
        // requestHasComments() is a check to see if a vacation request has comments.
        // this is used as a hide when

        if ($rootScope.vacationRequest.requestComments == null || $rootScope.vacationRequest.requestComments == ""){
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
                        'STATUS': "Cancelled",
                        'requestComments': combinedComments,
                        'minRequestComments': StrRightBack(combinedComments, ":")
                    };
                    break;

                case "reject":

                    data = {
                        'STATUS': "Rejected",
                        'requestComments': combinedComments,
                        'minRequestComments': StrRightBack(combinedComments, ":")
                    };
                    break;

                default:

                    break;
            }

            
            $http.patch(dataPUT + $rootScope.vacationRequest.unid + "?form=Vacation%20Request", data).then(function (response) {
                if (type == "cancel"){

                    createVacationDayDocuments($rootScope.vacationRequest.empNotesName, "Cancelled")
                        .then(function(){
                            // THIS NEEDS TO BE HERE TO GET THE UNID OF THE LOTUS DOCUMENT BECAUSE WE ARE NO LONGER CLOSING THE FORM.
                            // alert("here");
                            // $timeout(openRequest($rootScope.vacationRequest.requestID), 2000);
                            $timeout( function(){
                                getHoursForEachYear($rootScope.vacationRequest.requestedDates, "Cancelled");

                            }, 200);
                        })
                        .error(function(){
                            // alert("in error");
                            // $timeout(openRequest($rootScope.vacationRequest.requestID), 2000);
                            $timeout( function(){
                                getHoursForEachYear($rootScope.vacationRequest.requestedDates, "Cancelled");
                            }, 200);
                        });
                } else {

                    createVacationDayDocuments($rootScope.vacationRequest.empNotesName, "Rejected")
                        .then(function(){
                            // THIS NEEDS TO BE HERE TO GET THE UNID OF THE LOTUS DOCUMENT BECAUSE WE ARE NO LONGER CLOSING THE FORM.
                            // alert("here");
                            // $timeout(openRequest($rootScope.vacationRequest.requestID), 2000);
                            $timeout( function(){
                                getHoursForEachYear($rootScope.vacationRequest.requestedDates, "Rejected");

                            }, 200);
                        })
                        .error(function(){
                            // alert("in error");
                            // $timeout(openRequest($rootScope.vacationRequest.requestID), 2000);
                            $timeout( function(){
                                getHoursForEachYear($rootScope.vacationRequest.requestedDates, "Rejected");
                            }, 200);
                        });
                }

            });

            $('#commentsModal').modal('hide');
            // gotoMyRequests();
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

    function isApproved(){
        var currStatus = $rootScope.vacationRequest.status;
        if (currStatus == "Approved") {
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

    function isRejected(){
        var currStatus = $rootScope.vacationRequest.status;
        if (currStatus == "Rejected") {
            return true;
        } else {
            return false;
        }
    }

    function isCancelled(){
        var currStatus = $rootScope.vacationRequest.status;
        if (currStatus == "Cancelled") {
            return true;
        } else {
            return false;
        }
    }

    //TODO: Uncomment this code and remove the return true..
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
            $scope.userGroups.push(data[0].Group);
            getUserGroup();
            getVacationRequestsByGroup(data[0].Group);
            getAllGroupsForUser();


        }).
        error(function(data, status, headers, config) {
            // log error
        });
    }

    function getVacationProfileByUser(u){
        var requestString = vacationProfileURL + "?keys=" + u + "&keysexactmatch=true";
        $http.get(requestString).
        success(function(data) {
            $rootScope.userVacationProfile = data;



        }).
        error(function(data, status, headers, config) {
            // log error
        });
    }

    function updateVacationProfile(year, hoursSubmitted, hoursApproved, hoursCancelledOrRejected){

        var unidForYear;
        var currRequested;
        var currApproved;
        var currRemaining;
        var currTaken;

        for(var i = 0; i < $rootScope.vacationProfile.length; i++){
            if($rootScope.vacationProfile[i].Year == year){
                unidForYear = $rootScope.vacationProfile[i][unidStr];
                currRequested = $rootScope.vacationProfile[i].HoursRequested;
                currApproved = $rootScope.vacationProfile[i].HoursApproved;
                currRemaining = $rootScope.vacationProfile[i].HoursRemaining;
                currTaken = $rootScope.vacationProfile[i].HoursTaken;
            }
        }

        // calculate the changes
        var newSubmitted = currRequested + hoursSubmitted;
        var newApproved = currApproved + hoursApproved;
        var newRemaining = currRemaining - newSubmitted - newApproved - currTaken + hoursCancelledOrRejected;

        // now update the values and patch the document
        var data = {
            'HoursRequested': newSubmitted,
            'HoursApproved': newApproved,
            'HoursRemaining': newRemaining
        };



        
        $http.patch(dataPUT + unidForYear + "?form=Vacation%20Profile", data).then(function (response) {
            console.log(response);
        });
    }


    // This will be used for our accordian view.
    function getMyVacationRequestsByYear(){
        var u = $rootScope.empNotesName;
        var requestString = vacationDaysbyEMPURL + "?keys=" + u + "&keysexactmatch=true&count=" + dsMaxCount;
        $http.get(requestString).
        success(function(data) {

            $rootScope.myVacationRequestsByYear.shift();
            for(var i = 0; i < data.length; i++){
                var tmpHours;
                var tmpYear;
                var tmpDate;

                tmpDate = new Date(data[i].name);
                tmpYear = tmpDate.getFullYear();

                if (data[i].value == "Full Day"){
                    tmpHours = 8;
                } else {
                    tmpHours = 4;
                }



                $rootScope.myVacationRequestsByYear.push({
                    year: tmpYear,
                    hours: tmpHours,
                    status: data[i].STATUS,
                    requestID: data[i].lookupKey,
                    date: tmpDate.format("mm/dd/yyyy")
                });


            }

        }).
        error(function(data, status, headers, config) {
            // log error
        });
    }

    function getMyVacationRequests(){
        var u = $rootScope.empNotesName;
        var requestString = vacationRequestsURL + "?keys=" + u + "&keysexactmatch=true&count=" + dsMaxCount;
        $http.get(requestString).
        success(function(data) {
            $rootScope.myVacationRequests = data;

            for(var i = 0; i < data.length; i++){
                var tmpDatesArray = data[i].datesThisRequest.split(", ");


                //This ensures the individual dates are in descending order
                var datesArray = tmpDatesArray.sort(function(a,b) {
                    var date1 = new Date(a);
                    var date2 = new Date(b);

                    if (date1 < date2){
                        return 1;
                    }
                    if (date1 > date2){
                        return -1;
                    }
                });

                for(var j=0; j<datesArray.length; j++){
                    var tmpEnd = new Date(datesArray[j]);
                    $scope.mySource.push({
                        title: data[i].empName,
                        start: new Date(datesArray[j]),
                        end: tmpEnd.setDate(tmpEnd.getDate() + 1),
                        allDay: true,
                        stick: true
                    });
                }

                
            }
        }).
        error(function(data, status, headers, config) {
            // log error
        });
    }

    //TODO: Change this back to find the current empNotesName
    function getMyVacationRequestsToApprove(){
        //var u = $rootScope.empNotesName;
        var u = "CN=Nick Coccagna/O=TPJ";
        var requestString = vacationRequestsbyApproverURL + "?keys=" + u + "&keysexactmatch=true&count=" + dsMaxCount;
        $http.get(requestString).
        success(function(data) {
            $rootScope.myVacationRequestsToApprove = data;
        }).
        error(function(data, status, headers, config) {
            // log error
        });
    }


    function getVacationRequestsByGroupForMonth(group, monthStart, monthEnd){
        var tmpStartMonth = monthStart.getMonth();
        if (tmpStartMonth.toString.length == 1){
            tmpStartMonth = "0" + tmpStartMonth;
        }
        var tmpStartYear = monthStart.getFullYear();
        var tmpEndMonth = monthEnd.getMonth();
        if (tmpEndMonth.toString.length == 1){
            tmpEndMonth = "0" + tmpEndMonth;
        }
        var tmpEndYear = monthEnd.getFullYear();

        var startSearchString = tmpStartMonth + "%20AND%20" + tmpStartYear;
        var endSearchString = tmpEndMonth + "%20AND%20" + tmpEndYear;


        var requestString = vacationRequestsbyGroupURL + "?keys=" + group + "&keysexactmatch=true&count=" + dsMaxCount + "&search=FIELD%20datesThisRequest%20CONTAINS%20" + startSearchString + "%20OR%20FIELD%20datesThisRequest%20CONTAINS%20" + endSearchString;


        $http.get(requestString).
        success(function(data) {
            $rootScope.groupVacationRequestsForMonth = data;

            //first clear out the groupSource that holds the events
            $scope.groupSource = [];
            $scope.selectedGroup = group;

            for(var i = 0; i < data.length; i++){
                var datesArray = data[i].datesThisRequest.split(", ");
                for(var j=0; j<datesArray.length; j++){

                    var tmpEnd = new Date(datesArray[j]);
                    $scope.groupSource.push({
                        title: data[i].empName,
                        start: new Date(datesArray[j]),
                        end: tmpEnd.setDate(tmpEnd.getDate() + 1),
                        allDay: true,
                        stick: true
                    });
                }
            }

            $scope.eventSources3[0] = $scope.groupSource;

        }).
        error(function(data, status, headers, config) {
            // log error
        });
    }

    function getVacationRequestsByGroup(group){
        var requestString = vacationRequestsbyGroupURL + "?keys=" + group + "&keysexactmatch=true&count=" + dsMaxCount;
        $http.get(requestString).
        success(function(data) {
            $rootScope.groupVacationRequests = data;

            //first clear out the groupSource that holds the events
            $scope.groupSource = [];
            $scope.selectedGroup = group;

            for(var i = 0; i < data.length; i++){
                var datesArray = data[i].datesThisRequest.split(", ");
                for(var j=0; j<datesArray.length; j++){

                    var tmpEnd = new Date(datesArray[j]);
                    $scope.groupSource.push({
                        title: data[i].empName,
                        start: new Date(datesArray[j]),
                        end: tmpEnd.setDate(tmpEnd.getDate() + 1),
                        allDay: true,
                        stick: true
                    });
                }
            }

            $scope.eventSources3[0] = $scope.groupSource;

        }).
        error(function(data, status, headers, config) {
            // log error
        });

    }

    function getAllGroupsForUser(){
        var empNotesName = $rootScope.empNotesName;
        var requestString = getGroupByApproverURL + "?keys=" + empNotesName + "&keysexactmatch=true";
        $http.get(requestString).
        success(function(data) {
            for(var i=0; i < data.length; i++){
                $scope.userGroups.push(data[i].GroupName);
            }
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


    function getRequest(id){
        var requestString = vacationRequestsbyIDURL + "?keys=" + id + "&keysexactmatch=true&count=" + dsMaxCount;
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
            $rootScope.vacationRequest.groupName = data[0].groupName;
            $rootScope.vacationRequest.requestID = data[0].requestID;
            $rootScope.vacationRequest.unid = data[0][unidStr];

            getVacationProfileByUser(data[0].EMPNOTESNAME);

            var vacationDaysRequestString = vacationDaysbyIDURL + "?keys=" + $rootScope.vacationRequest.requestID + "&keysexactmatch=true&count=" + dsMaxCount;

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


                for(var j=0; j < $rootScope.vacationRequest.requestedDates.length; j++){
                    var tmpArray = $rootScope.vacationRequest.requestedDates;

                    var datesArray = tmpArray[j].name.split(", ");

                    var tmpEnd = new Date(datesArray[1] + " " + datesArray[2]);
                    var tmpTitle = j + 1;
                    $scope.thisRequestSource.push({
                        title: "Day: " + tmpTitle.toString(),
                        start: new Date(new Date(datesArray[1] + " " + datesArray[2])),
                        end: tmpEnd.setDate(tmpEnd.getDate() + 1),
                        allDay: true,
                        stick: true
                    });
                }

                // For the form calendars, go to the first date in the request
                $('#editCalendar').fullCalendar( 'gotoDate', $scope.thisRequestSource[0].start );
                $('#readCalendar').fullCalendar( 'gotoDate', $scope.thisRequestSource[0].start );

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

    
    // This will be just like the clear button, but we need will also need to give the user their hours back on their
    // Vacation Profile.

    function adminClearDateFromRequest (selectedDate){

        if (isSaved() == true & $rootScope.vacationRequest.requestedDates.length == 1){
            $scope.modal.title = "Unable to Remove Date";
            $scope.modal.body = "You must have at least one date on a document that has already been saved.";
            $scope.modal.buttons = [];
            var button1 = {};
            button1.label = "OK";
            button1.callback = "";
            $scope.modal.buttons.push(button1);
            $('#myModal').modal('show');
        } else {
            var selectedDateValue = $rootScope.vacationRequest.requestedDates[selectedDate].value;
            var selectedDateName = $rootScope.vacationRequest.requestedDates[selectedDate].name;
            var theDate = new Date(convertStrToDate(selectedDateName));
            var theYear = theDate.getFullYear();

            var hours = 0;
            if (selectedDateValue == "Full Day") {
                hours = 8;
                $rootScope.vacationRequest.hoursThisRequest -= hours;
            } else {
                hours = 4;
                $rootScope.vacationRequest.hoursThisRequest -= hours;
            }


            var selectedUNID = $rootScope.vacationRequest.requestedDates[selectedDate].unid;
            var deleteString = dataPUT + "/" + selectedUNID;
            $http.delete(deleteString).success(function (data) {

            }).error(function (data, status, headers, config) {

            });


            $rootScope.vacationRequest.requestedDates.splice(selectedDate, 1);


            //we do a second check here because we don't want to save the document until we have spliced the array.
            //but we also don't want to delete the day documents after we splice because it will throw an error
            saveVacationRequestWhenTaken(hours);

            // now we need to take the value of hours from taken and put it in remaining
            for (var i = 0; i < $rootScope.vacationProfile.length; i++) {
                if ($rootScope.vacationProfile[i].Year == theYear) {
                    var tmpUNID = $rootScope.vacationProfile[i][unidStr];
                    var data = {
                        'HoursTaken': $rootScope.vacationProfile[i].HoursTaken - hours,
                        'HoursRemaining': $rootScope.vacationProfile[i].HoursRemaining + hours
                    };

                    console.log(tmpUNID);


                    $http.patch(dataPUT + tmpUNID + "?form=Vacation%20Profile", data).then(function (response) {
                        console.log(response);
                    });

                }
            }

        }
    }



    function clearDateFromRequest(selectedDate){

        if (isSaved() == true & $rootScope.vacationRequest.requestedDates.length == 1){
            $scope.modal.title = "Unable to Remove Date";
            $scope.modal.body = "You must have at least one date on a document that has already been saved.";
            $scope.modal.buttons = [];
            var button1 = {};
            button1.label = "OK";
            button1.callback = "";
            $scope.modal.buttons.push(button1);
            $('#myModal').modal('show');
        } else {

            var selectedDateValue = $rootScope.vacationRequest.requestedDates[selectedDate].value;
            var selectedDateName = $rootScope.vacationRequest.requestedDates[selectedDate].name;
            var theDate = new Date(convertStrToDate(selectedDateName));
            var theYear = theDate.getFullYear();

            var hours = 0;
            if (selectedDateValue == "Full Day") {
                hours = 8;
                $rootScope.vacationRequest.hoursThisRequest -= hours;
            } else {
                hours = 4;
                $rootScope.vacationRequest.hoursThisRequest -= hours;
            }

            if (isSaved() == true) {
                var selectedUNID = $rootScope.vacationRequest.requestedDates[selectedDate].unid;
                var deleteString = dataPUT + "/" + selectedUNID;
                $http.delete(deleteString).success(function (data) {

                }).error(function (data, status, headers, config) {

                });
            }

            $rootScope.vacationRequest.requestedDates.splice(selectedDate, 1);


            //we do a second check here because we don't want to save the document until we have spliced the array.
            //but we also don't want to delete the day documents after we splice because it will throw an error


            for (var i = 0; i < $rootScope.vacationProfile.length; i++) {
                if ($rootScope.vacationProfile[i].Year == theYear) {
                    var tmpUNID = $rootScope.vacationProfile[i][unidStr];

                    if ($rootScope.vacationRequest.status == "Submitted") {
                        var data = {
                            'HoursRequested': $rootScope.vacationProfile[i].HoursRequested - hours,
                            'HoursRemaining': $rootScope.vacationProfile[i].HoursRemaining + hours
                        };
                    } else {
                        var data = {
                            'HoursApproved': $rootScope.vacationProfile[i].HoursApproved - hours,
                            'HoursRemaining': $rootScope.vacationProfile[i].HoursRemaining + hours
                        };
                    }


                    $http.patch(dataPUT + tmpUNID + "?form=Vacation%20Profile", data).then(function (response) {
                        console.log(response);
                    });

                }
            }

            if (isSaved() == true) {
                saveVacationRequest();
            }

        }
    }

    function recalculateHours(){
        var myForm = $window.document.getElementById('myForm');
        var myElements = myForm.getElementsByTagName("input");
        var total = 0;

        // var selectedDays = [];
        for (var i=0; i<myElements.length; i++){
            if (myElements[i].checked === true){
                // selectedDays.push(myElements[i]);
                if (myElements[i].value == "Full Day"){
                    total += 8;
                } else {
                    total += 4;
                }
            }
        }
        $rootScope.vacationRequest.hoursThisRequest = total;

    }


    function sendMemo(status, memoTo, url, comments){


        var data = {
            'status': status,
            'url': url,
            'comments': comments,
            'hoursOver': $rootScope.vacationRequest.hoursOver,
            'memoTo': memoTo
        };

        $http.post(dataPOST + "?form=MemoRequest", data).then(function (response) {
            // console.log(response)
        });

    }

    function testSendMemo(){
        sendMemo("Submitted", "CN=Chad Moyer/O=TPJ", "www.google.com", "Test Comments");
    }

    function gotoMyRequests(){
        $window.location.href = "myRequests.html";
    }

    function gotoMyApprovals(){
        $window.location.href = "myApprovals.html";
    }

    function goBack(){
        $window.location.href = $window.history.back();
    }

    function closeVacationRequest(){
        //check to see if the form is saved first
        if($rootScope.vacationRequest.status == "New"){
            $window.location.href = "myRequests.html"
        } else {
            $window.location.href = $window.history.back();
        }


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
    
    function isHoliday(selectedDate, holidayList){
        var tmpSelectedDate = new Date(selectedDate);
        var selectedDay = tmpSelectedDate.getDate();
        var selectedMonth = tmpSelectedDate.getMonth()+1;
        var selectedYear = tmpSelectedDate.getFullYear();
        var selectedDateStr = selectedMonth + "/" + selectedDay + "/" + selectedYear;
       
        for(var i = 0; i < holidayList.length; i++){
            var dateString = StrLeft(holidayList[i].HolidayDate, "T");
            var tmpDate = new Date(dateString);
            var holidayDay = tmpDate.getDate()+1;
            var holidayMonth = tmpDate.getMonth()+1;
            var holidayYear = tmpDate.getFullYear();
            var holidayDateStr = holidayMonth + "/" + holidayDay + "/" + holidayYear;

            if (holidayDateStr == selectedDateStr){
                return true;
            }
        }

        return false;
    }


//     // *********************************************
//     // Angular Calendar
//     // *********************************************
    var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();
    $scope.eventSource = {};

    $scope.mySource = [];

    $scope.groupSource = [];

    $scope.thisRequestSource = [];


    /* event source that calls a function on every view switch */
    //$scope.eventsF = $rootScope.holidayList;

    /* alert on eventClick */
    $scope.alertOnEventClick = function( date, jsEvent, view){
        // $scope.alertMessage = (date.title + ' was clicked ');
        // alert($scope.alertMessage);
    };

    $scope.consoleOnEventClick = function( date, jsEvent, view){

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
            eventDrop: $scope.alertOnDrop,
            eventResize: $scope.alertOnResize,
            eventRender: $scope.eventRender,
            
            viewRender: function(view, element){
                var start = new Date(view.start);
                var end = new Date(view.end);

                // start is the first visible day. In month-view, this value is often before the 1st day of the month,
                // because most months do not begin on the first day-of-week.
                // end is the last visible day.
                $scope.monthStart = start;
                $scope.monthEnd = end;
                getVacationRequestsByGroupForMonth($rootScope.groupName, start, end);
            }
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
                        if (isHoliday(selectedDate, $rootScope.holidayList) == false){
                            vacationDays.push(selectedDate);
                        }
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
                        "value": "Full Day"
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

                $rootScope.vacationRequest.requestedDates = tmpRequestDates;
                $rootScope.vacationRequest.hoursThisRequest = $rootScope.vacationRequest.requestedDates.length * 8;

                var length = tmpRequestDates.length;
                var tmpStartDate = new Date(convertStrToDate(tmpRequestDates[0].name));
                var tmpEndDate = new Date(convertStrToDate(tmpRequestDates[length-1].name));

                $rootScope.vacationRequest.startDate = tmpStartDate;
                $rootScope.vacationRequest.endDate = tmpEndDate;

            }
        }
    };

    //$scope.eventSources = [$scope.eventSource, $scope.holidays];

    //This will be the current users requests
    $scope.eventSources2 = [$scope.mySource, $scope.holidays];

    //This will be an entire group's requests
    $scope.eventSources3 = [$scope.groupSource, $scope.holidays];

    //This will be a single request's days
    $scope.eventSources4 = [$scope.thisRequestSource, $scope.holidays];





}