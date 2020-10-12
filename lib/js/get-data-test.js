//adapted from the cerner smart on fhir guide. updated to utalize client.js v2 library and FHIR R4

//create a fhir client based on the sandbox enviroment and test paitnet.
const client = new FHIR.client({
  serverUrl: "https://r4.smarthealthit.org",
  tokenResponse: {
    patient: "37e97ea5-e2dc-4770-bb7d-93d02cfebb0c"
  }
});

//function to display list of medications
function displayPatients(meds) {
  med_list.innerHTML += "<li> " + meds + "</li>";
}

//update function to take in text input from the app and add the note for the latest weight observation annotation
//you should include text and the author can be set to anything of your choice. keep in mind that this data will
// be posted to a public sandbox
function addWeightAnnotation() {
  zipcode = document.getElementById('zipcode').value;
  minimum_age = document.getElementById('minimumage').value;
  maximum_age = document.getElementById('maximumage').value;
  state = document.getElementById('state').value;
  if ((typeof zipcode == 'undefined' || !zipcode) && (typeof state == 'undefined' || !state)) {
    window.alert("Please specify zipcode or state!");
    return;
  }
  if (zipcode && state) {
    window.alert("Please specify either zipcode or state!");
    return;
  }
  if (typeof minimum_age == 'undefined' || !minimum_age) {
    window.alert("Please specify minimum age!");
    return;
  }
  if (typeof maximum_age == 'undefined' || !maximum_age) {
    window.alert("Please specify maximum age!");
    return;
  }
  console.log(zipcode);
  var query = new URLSearchParams();
  if (zipcode) {
    query.set("address-country", "US");
  }
  else if (state) {
    query.set("address-state", state);
  }
  query.set("address-country", "US");
  client.request("Patient?" + query, {
    pageLimit: 0,
    flat: true
  }).then(
    function(patients) {
    // get medication request resources this will need to be updated
    // the goal is to pull all the medication requests and display it in the app. It can be both active and stopped medications
    patients.forEach(function(patient) {
      age = datediff(parseDate(getTodayDate()), parseDate(patient.birthDate));
      if (age < (minimum_age * 365) || age > (maximum_age * 365)) {
        return;
      }
      console.log(patient);
      // Get the conditions of each patient
      patient_conditions = getConditions(patient.id);
      return Promise.all([patient_conditions]).then(function(data) {
        console.log(data);
        if (!isResolved(data)) {
          return;
        }
        var patientInfo = {Name: patient.name[0].given[0] + " " + patient.name[0].family, Gender: patient.gender, Contact: patient.telecom[0].value, Birthdate: patient.birthDate}
        displayPatients(JSON.stringify(patientInfo));
      });
    })}
);
}

//event listner when the add button is clicked to call the function that will add the note to the weight observation
document.getElementById('add').addEventListener('click', addWeightAnnotation);

function parseDate(str) {
  var mdy = str.split('-');
  return new Date(mdy[0],  mdy[1], mdy[2]-1);
}

function datediff(first, second) {
  // Take the difference between the dates and divide by milliseconds per day.
  // Round to nearest whole number to deal with DST.
  return Math.round((second-first)/(1000*60*60*24));
}

function getTodayDate() {
  var today = new Date(); 
  var dd = today.getDate(); 
  var mm = today.getMonth() + 1; 

  var yyyy = today.getFullYear(); 
  if (dd < 10) { 
      dd = '0' + dd; 
  } 
  if (mm < 10) { 
      mm = '0' + mm; 
  } 
  var today = dd + '-' + mm + '-' + yyyy;
  return today;
}

function getConditions(patientId) {
  var query = new URLSearchParams();
  var flag = false;
  var conditions = "";
  query.set("patient", patientId);
  return client.request("Condition?" + query, {
    pageLimit: 0,
    flat: true
  }).then();
}

function isResolved(conditions) {
  var diabetes = document.getElementById("diabetes").checked;
  var hypertension = document.getElementById("hypertension").checked;
  var obesity = document.getElementById("obesity").checked;
  var cardio = document.getElementById("cardio").checked;
  var lung = document.getElementById("lung").checked;
  var smoking = document.getElementById("smoking").checked;
  var pregnancy = document.getElementById("pregnancy").checked;
  var codes = new Set();
  if (diabetes) {
    codes.add("44054006");
    codes.add("73211009");
    codes.add("15777000");
  }
  if (hypertension) {
    codes.add("38341003");
    codes.add("59621000");
  }
  if (obesity) {
    codes.add("414916001");
    codes.add("238131007");
  }
  if (cardio) {
    codes.add("56265001");
  }
  if (lung) {
    codes.add("13645005");
  }
  if (smoking) {
    codes.add("77176002");
  }
  if (pregnancy) {
    codes.add("77386006");
    codes.add("72892002");
  }
  conditions = conditions[0];
  if (!diabetes && !hypertension && !obesity && !cardio && !lung && !smoking && !pregnancy) {
    for (i = 0; i < conditions.length; i++) {
      for (j = 0; j < conditions[i].clinicalStatus.coding.length; j++) {
        console.log(conditions[i].clinicalStatus.coding[j].code);
        if (conditions[i].clinicalStatus.coding[j].code !== "resolved") {
          return false;
        }
      }
    }
  } else {
    for (i = 0; i < conditions.length; i++) {
      for (j = 0; j < conditions[i].clinicalStatus.coding.length; j++) {
        if (codes.has(conditions[i].code.coding[j].code) && conditions[i].clinicalStatus.coding[j].code !== "resolved") {
          return false;
        }
      }
    }
  }
  console.log(conditions);
  return true;
}

function getAllCodes() {
  var query = new URLSearchParams();
  query.set("code", "238131007")
  client.request("Condition?" + query, {
    pageLimit: 0,
    flat: true
  }).then(
    function(patients) {
      console.log(patients);
    });
}

getAllCodes();