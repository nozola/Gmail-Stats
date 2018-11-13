// Client ID and API key from the Developer Console
let CLIENT_ID = '769177896397-edpv4hv24pa90g30q811vl62h2albhsa.apps.googleusercontent.com';
let API_KEY = 'AIzaSyDbUIiSuoQ0_xI7ZsF17ZvK2zEQLMD7jaE';

// Array of API discovery doc URLs for APIs used by the quickstart
let DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
let SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

let authorizeButton = document.getElementById('authorize_button');
let signoutButton = document.getElementById('signout-button');
let getResultsButton = document.getElementById('submit-query');
let visibleWhenAuthorized = document.getElementsByClassName("visible-when-authorized");
let visibleWhenChart = document.getElementsByClassName("visible-when-chart");

let startDateValue = "",
    endDateValue = "";

let checkedLabels = []; // Setting variable for checked labels here to be accessible globally
let userLabels = []; // Setting variable for the user's custom labels (not system labels)
let mailData = {}; // This will hold all of the data to be displayed in the report

let ctx = document.getElementById('chart-area').getContext('2d');
let chartColors = ["rgb(46, 204, 113)","rgb(52, 152, 219)","rgb(155, 89, 182)","rgb(52, 73, 94)","rgb(241, 196, 15)","rgb(230, 126, 34)","rgb(231, 76, 60)","rgb(39, 174, 96)","rgb(41, 128, 185)","rgb(142, 68, 173)","rgb(44, 62, 80)","rgb(243, 156, 18)","rgb(211, 84, 0)","rgb(192, 57, 43)"];
// Create data structure
let reportData = {
  datasets: [{
    data: [],
    backgroundColor: chartColors,
    label: 'Labels'
  }],
  labels: []
};
// Create Initial Chart
let myPieChart = new Chart(ctx,{
  type: 'pie',
  data: reportData,
  options: {
    responsive: true
  }
});
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
        getResultsButton.onclick = handleGetResultsClick;
      });
    } else {
      // Handle the initial sign-in state.
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      //authorizeButton.onclick = handleAuthClick;
      signoutButton.onclick = handleSignoutClick;
      getResultsButton.onclick = handleGetResultsClick;
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
    showConditional(visibleWhenAuthorized);
    listLabels();
  } else {
    //authorizeButton.style.display = 'block';
    //signoutButton.style.display = 'none';
    for(let i = 0; i < visibleWhenAuthorized.length; i++){
        visibleWhenAuthorized[i].style.display = "none";
    }
  }
}

function showConditional(elements) {
  for(let i = 0; i < elements.length; i++){
      elements[i].style.display = elements[i].dataset.visible;
  }
}

function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
  window.location.href = "./"; //Redirect to same page
}

function handleGetResultsClick() {
  mailData = {}; // Reset the report data
  checkedLabels = []; // Reset the checkedLabels

  let query = "";
  let labelIDs = [];
  let startDate = document.getElementById("start-date"),
      endDate = document.getElementById("end-date"),
      sentTo = document.getElementById("sent-to"),
      sentFrom = document.getElementById("sent-from");
  startDateValue = startDate.value;
  endDateValue = endDate.value;
  if(startDate.value != "" && endDate.value != "") {
    query += "after:"+startDate.value+" before:"+endDate.value+" ";
  }
  if(sentTo.value != "") { query += "to:"+sentTo.value+" "; }
  if(sentFrom.value != "") { query += "from:"+sentFrom.value+" "; }

  function getCheckedBoxes(chkboxName) {
    let checkboxes = document.getElementsByName(chkboxName);
    let checkboxesChecked = [];
    // loop over them all
    for (let i=0; i<checkboxes.length; i++) {
       // And stick the checked ones onto an array...
       if (checkboxes[i].checked) {
          checkboxesChecked.push(checkboxes[i].value);
       }
    }
    // Return the array if it is non-empty, or null
    return checkboxesChecked.length > 0 ? checkboxesChecked : null;
  }
  checkedLabels = getCheckedBoxes("checkbox_labels");

  if (labelIDs.length > 0) {
    query += " AND ";
    for (let ii = 0; ii < labelIDs.length; ii++) {
      query += "label:"+labelIDs[ii];
      if ( ii < (labelIDs.length - 1) ) {
        query += " OR ";
      }
    }
  }

  listMessages(query,logResult);
}

function addLabel(labelContent) {
  userLabels[labelContent.id] = labelContent.name;
  let labels = document.getElementById('labels');
  let inputDiv = document.createElement('div');
  inputDiv.classList.add("input-area");
  labels.appendChild(inputDiv);
  let checkbox = document.createElement('input');
  checkbox.type = "checkbox";
  checkbox.name = "checkbox_labels";
  checkbox.value = labelContent.id;
  checkbox.id = "label_"+labelContent.id;

  let label = document.createElement('label');
  let labelText = document.createTextNode(labelContent.name);
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
  let labels = document.getElementById('labels');
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
    let labels = response.result.labels;
    //appendPre('Labels:');

    if (labels && labels.length > 0) {
      for (i = 0; i < labels.length; i++) {
        let label = labels[i];
        if (label.type == "user") {
          addLabel(label);
        }
      }
    } else {
      addLabel('No Labels found.');
    }
  });
}

/**
 * Retrieve Messages in user's mailbox matching query.
 *
 * @param  {String} userId User's email address. The special value 'me'
 * can be used to indicate the authenticated user.
 * @param  {String} query String used to filter the Messages listed.
 * @param  {Function} callback Function to call when the request is complete.
 */
function listMessages(query, callback) {
  let userId = "me";
  let getPageOfMessages = function(request, result) {
    request.execute(function(resp) {
      result = result.concat(resp.messages);
      let nextPageToken = resp.nextPageToken;
      if (nextPageToken) {
        request = gapi.client.gmail.users.messages.list({
          'userId': userId,
          'pageToken': nextPageToken,
          'q': query,
          'maxResults': 1000
        });
        getPageOfMessages(request, result);
      } else {
        if (result == "" || result.length == 0){
          console.log("No Results...");
        } else {
          callback(result);
        }
      }
    });
  };
  let initialRequest = gapi.client.gmail.users.messages.list({
    'userId': userId,
    'q': query,
    'maxResults': 1000
  });
  getPageOfMessages(initialRequest, []);
}

function logResult(result) {
  if (result.length > 0) {
    let batchMessages = gapi.client.newBatch();
    let messageRequester = function(messageId) {
      return gapi.client.gmail.users.messages.get({
        'userId': "me",
        'id': messageId,
        'format': "minimal"
      });
    };
    for (let i = 0; i < result.length; i++) {
      if(result[i].hasOwnProperty("id")){
        let messageRequest = messageRequester(result[i].id);
        batchMessages.add(messageRequest);
        //getMessage(result[i].id, logMessages);
      }
    }
    batchMessages.then(function(response){
      //Success
      // console.log("Success: ");
      // console.log(response);
      for (messageID in response.result) {
        let message = response.result[messageID].result;
        //console.log(message);
        if(message.hasOwnProperty("labelIds")){
          logMessages(message);
        }
      }
      updateReportChart();

    },function(reason){
      //Error
      console.log("Error: "+reason);
    });
  } else {
    console.log("No messages found...");
  }
}

function logMessages(message) {
  let labelIDs = message.labelIds;
  //console.log("Labels: "+labelIDs);
  for (let i = 0; i < labelIDs.length; i++) {
    if( checkedLabels == null || checkedLabels.includes(labelIDs[i]) ) { // Filter out labels that aren't checked
      if( userLabels.hasOwnProperty(labelIDs[i]) ) { // Filter out system labels
        if (mailData.hasOwnProperty(labelIDs[i])) {
          mailData[labelIDs[i]]++;
        } else {
          mailData[labelIDs[i]] = 1;
        }
      }
    }
  }
}

function updateReportChart(){
  showConditional(visibleWhenChart);
  // Clear dataset
  reportData.datasets[0].data = [];
  reportData.labels = [];
  // Add data to data structure
  for (key in mailData) {
    reportData.datasets[0].data.push(mailData[key]);
    reportData.labels.push(userLabels[key]);
  }
  myPieChart.update();
}

/**
 * Get Message with given ID.
 *
 * @param  {String} userId User's email address. The special value 'me'
 * can be used to indicate the authenticated user.
 * @param  {String} messageId ID of Message to get.
 * @param  {Function} callback Function to call when the request is complete.
 */
function getMessage(messageId, callback) {
  let request = gapi.client.gmail.users.messages.get({
    'userId': "me",
    'id': messageId,
    'format': "minimal"
  });
  request.execute(callback);
}

function downloadCSV() {
  // Example: mailData = { Label_1: 12, Label_2:5, Label_3:9 }
  // const rows = [["name1", "city1", "some other info"], ["name2", "city2", "more info"]];
  let csvContent = "data:text/csv;charset=utf-8,";
  // rows.forEach(function(rowArray){
  //   let row = rowArray.join(",");
  //   csvContent += row + "\r\n";
  // });
  for(key in mailData) {
    let row = userLabels[key]+","+mailData[key];
    csvContent += row + "\r\n";
  }

  let encodedUri = encodeURI(csvContent);
  let link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "Gmail_Stats_"+startDateValue+"_"+endDateValue+".csv");
  document.body.appendChild(link); // Required for FF

  link.click(); // This will download the data file named "my_data.csv".
}
