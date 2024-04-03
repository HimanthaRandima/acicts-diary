const CLIENT_ID = "YOUR_KEY.apps.googleusercontent.com";
const API_KEY = "YOUR_KEY";

const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

const SCOPES = "https://www.googleapis.com/auth/calendar";

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById("authorize_button").style.visibility = "hide";
document.getElementById("refresh_button").style.visibility = "hidden";
document.getElementById("signout_button").style.visibility = "hidden";
document.getElementById("content").innerHTML = `<h2>Please Sign In</h2>`

function gapiLoaded() {
  gapi.load("client", initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableButtons();
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: "",
  });
  gisInited = true;
  maybeEnableButtons();
}

function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById("authorize_button").style.visibility = "visible";
  }
}

function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw resp;
    }
    document.getElementById("signout_button").style.visibility = "visible";
    document.getElementById("authorize_button").style.visibility = "hidden";
    document.getElementById("refresh_button").style.visibility = "visible";
    await listUpcomingEvents();
  };

  if (gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({ prompt: "consent" });
  } else {
    tokenClient.requestAccessToken({ prompt: "" });
  }
}

function handleSignoutClick() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken("");
    document.getElementById("content").innerText = "";
    document.getElementById("authorize_button").innerText = "Authorize";
    document.getElementById("signout_button").style.visibility = "hidden";
  }
}

async function listUpcomingEvents() {
  let response;
  try {
    const request = {
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 10,
      orderBy: "startTime",
    };
    response = await gapi.client.calendar.events.list(request);
  } catch (err) {
    document.getElementById("content").innerText = err.message;
    return;
  }

  const events = response.result.items;
  if (!events || events.length == 0) {
    document.getElementById("content").innerText = "No events found.";
    return;
  }

  console.log(events)

  const output = events.reduce(
    (str, event) =>
      `${str}${event.summary} (${event.start.dateTime || event.start.date})\n`,
    "Events:\n"
  );

  document.getElementById("content").innerHTML = ""

  events.forEach((event) => {
    const inputDate = new Date(event.start.dateTime);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = inputDate.toLocaleDateString('en-US', options);

    const optionsTime = { hour: 'numeric', minute: '2-digit', hour12: true };
    const formattedTime = inputDate.toLocaleTimeString('en-US', optionsTime);

    document.getElementById("content").innerHTML += `
    <div class="card">
    <div class="card-body">
      <h5 class="card-title">${event.summary}</h5>
      <p class="card-text">${event.description}</p>
      <ul>
      <li class="card-text">Venue: ${event.location}</li>
      <li class="card-text">Date: ${formattedDate}</li>
      <li class="card-text">Start Time: ${formattedTime}</li>
      </ul>
    </div>
  </div><br>`
  })

}

const addEvent = () => {
  const title = document.getElementById("title").value;
  const desc = document.getElementById("desc").value;
  const venue = document.getElementById("venue").value;
  const date = document.getElementById("date").value;
  const start = document.getElementById("st").value;
  const end = document.getElementById("et").value;
  const reminder = document.getElementById("reminder").value;

  const startTime = new Date(date + "," + start).toISOString();
  const endTime = new Date(date + "," + end).toISOString();

  var event = {
    summary: title,
    location: venue,
    description: desc,
    start: {
      dateTime: startTime,
      timeZone: "Asia/Colombo",
    },
    end: {
      dateTime: endTime,
      timeZone: "Asia/Colombo",
    },
    recurrence: ["RRULE:FREQ=DAILY;COUNT=1"],
    attendees: [{ email: "acictsdev24@gmail.com" }, { email: "himantha85@gmail.com" }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: parseInt(reminder) },
      ],
    },
  };

  var request = gapi.client.calendar.events.insert({
    calendarId: "primary",
    resource: event,
  });

  request.execute(function (event) {
    console.log(event.htmlLink);
    document.getElementById("event_form").reset();
    listUpcomingEvents();
  });
};