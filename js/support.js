/**
 * Created by rcrum on 2/9/2016.
 */
//--------------------------------------------------------------------------------------------------------------
//  Support functions
//--------------------------------------------------------------------------------------------------------------

function StrLeft(str, subStr){
    //get the characters to the left of a substring
    if (typeof str === 'undefined'){
        str = '';
    }
    var sIndex = str.indexOf(subStr);
    if (sIndex == -1){
        return "";
    }
    else {
        return str.slice(0,sIndex);
    }
}

function StrRight(str, subStr){
    //get the characters to the right of a substring
    if (typeof str === 'undefined'){
        str = '';
    }
    var sIndex = str.indexOf(subStr);
    if (sIndex == -1){
        return "";
    }
    else {
        return str.slice(sIndex+1);
    }
}

function StrLeftBack(str, subStr){
    //get the characters to the right of a substring
    if (typeof str === 'undefined'){
        str = '';
    }
    var sIndex = str.lastIndexOf(subStr);
    if (sIndex == -1){
        return "";
    }
    else {
        return str.slice(0,sIndex);
    }
}

function StrRightBack(str, subStr){
    //get the characters to the right of a substring
    if (typeof str === 'undefined'){
        str = '';
    }
    var sIndex = str.lastIndexOf(subStr);
    if (sIndex == -1){
        return "";
    }
    else {
        return str.slice(sIndex+1);
    }
}

// loop through all properties of an object and check to see if any of them contain non-null values
function entryHasData(obj) {
    for (var property in obj) {
        // each object has a $$hashKey value, so ignore it
        if (obj.hasOwnProperty(property) && property != '$$hashKey' && property != 'OBJECTID') {
            if (obj[property] != null) {
                return true;
            }
        }
    }
    return false;
}

// code to run when user changes the orientation of their iPad or phone
function orientationChange() {
    refreshIframe("mapIFrame");
}

function logoutUser(){
    //log the current user out and then redirect them
    var currURL = window.location;
    var redirectURL = "https://www.pjdick.com/tpjwebsite.nsf/pngMapsLogout?openPage";
    //window.location = dataURL + "?Logout&RedirectTo=" + currURL;
    window.location = "//www.pjdick.com/TPJVacationTracker.nsf" + "?Logout&RedirectTo=" + redirectURL;
}

function refreshIframe(iframeId) {
    var iFrame = document.getElementById(iframeId);
    iFrame.src = iFrame.src;
}

function currentDateTime() {
    //get the current date and time in mm/dd/yyyy hh:mm:ss format
    var currentdate = new Date();
    var d = currentdate.getDate();
    var m = currentdate.getMonth()+1;
    var y = currentdate.getFullYear();
    var h = currentdate.getHours();
    var n = currentdate.getMinutes();
    var s = currentdate.getSeconds();
    var ampm;
    if (h < 12) {
        ampm = "AM";
        if (h == 0) {
            h = 12;  //midnight
        }
    }
    else {
        ampm = "PM";
        if (h > 12) {
            h = h-12; //afternoon
        }
    }
    return m + "/" + d + "/" + y + " " + h + ":" + n + ":" + s + " " + ampm;
}

function currentDate(){
    var currentdate = new Date();
    var d = currentdate.getDate();
    var m = currentdate.getMonth()+1;
    var y = currentdate.getFullYear();

    return m + "/" + d + "/" + y;
}

function formatDate(date){
    var currentdate = new Date(date);
    var d = currentdate.getDate();
    var m = currentdate.getMonth()+1;
    var y = currentdate.getFullYear();

    return m + "/" + d + "/" + y;
}

function getQueryString( field, url ) {
    var href = url ? url : window.location.href;
    var reg = new RegExp( '[?&]' + field + '=([^&#]*)', 'i' );
    var string = reg.exec(href);
    return string ? string[1] : null;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function showAlert(alertId, expires){
    $('#' + alertId).show();
    if (expires){
        if (!isNaN(expires)){
            window.setTimeout(function() {
                $("#" + alertId).hide("Blind");
            }, expires);
        }
    }
}