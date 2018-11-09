// Client ID and API key from the Developer Console
var CLIENT_ID = '769177896397-edpv4hv24pa90g30q811vl62h2albhsa.apps.googleusercontent.com';
var API_KEY = 'AIzaSyDbUIiSuoQ0_xI7ZsF17ZvK2zEQLMD7jaE';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');
var visibleWhenAuthorized = document.getElementsByClassName("visible-when-authorized");

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
    if(!gapi.auth2.getAuthInstance().isSignedIn.get()) {
      gapi.auth2.getAuthInstance().signIn().then(function() { // Initiate Authorization on load
        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        //authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
      });
    } else {
      // Handle the initial sign-in state.
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      //authorizeButton.onclick = handleAuthClick;
      signoutButton.onclick = handleSignoutClick;
    }
  });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    //authorizeButton.style.display = 'none';
    //signoutButton.style.display = 'block';
    showAuthorized();
    listLabels();
  } else {
    //authorizeButton.style.display = 'block';
    //signoutButton.style.display = 'none';
    for(var i = 0; i < visibleWhenAuthorized.length; i++){
        visibleWhenAuthorized[i].style.display = "none";
    }
  }
}

function showAuthorized() {
  for(var i = 0; i < visibleWhenAuthorized.length; i++){
      visibleWhenAuthorized[i].style.display = visibleWhenAuthorized[i].dataset.visible;
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
  window.location.href = "./"; //Redirect to same page
}

function addLabel(labelContent) {
  var labels = document.getElementById('labels');
  var inputDiv = document.createElement('div');
  inputDiv.classList.add("input-area");
  labels.appendChild(inputDiv);
  var checkbox = document.createElement('input');
  checkbox.type = "checkbox";
  checkbox.name = "label_"+labelContent.id;
  checkbox.value = labelContent.id;
  checkbox.id = "label_"+labelContent.id;

  var label = document.createElement('label');
  var labelText = document.createTextNode(labelContent.name);
  // Set Default Colors
  if(!labelContent.hasOwnProperty('color')) {
    labelContent.color = {
      'textColor': 'black',
      'backgroundColor': '#DDD'
    }
  }
  label.htmlFor = "label_"+labelContent.id;
  label.appendChild(labelText);
  label.style.color = labelContent.color.textColor;
  label.style.backgroundColor = labelContent.color.backgroundColor;

  inputDiv.appendChild(checkbox);
  inputDiv.appendChild(label);
}

function clearLabels() {
  var labels = document.getElementById('labels');
  labels.innerHTML = "";
}

/**
 * Print all Labels in the authorized user's inbox. If no labels
 * are found an appropriate message is printed.
 */
function listLabels() {
  gapi.client.gmail.users.labels.list({
    'userId': 'me'
  }).then(function(response) {
    clearLabels();
    var labels = response.result.labels;
    //appendPre('Labels:');

    if (labels && labels.length > 0) {
      for (i = 0; i < labels.length; i++) {
        var label = labels[i];
        addLabel(label);
      }
    } else {
      addLabel('No Labels found.');
    }
  });
}
