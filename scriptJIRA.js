const cloudId = "315e7629-5056-4a70-9077-97c3637a4366";
let startAt = 0;
const maxResults = 100;
const token =
  "Basic c3RldmUuZ2FybmVyaUB0ZWFtc3RhcnRlci5jbzpBVEFUVDN4RmZHRjBFX3pWM2RCTC1DM0FUUENaSE1lcm80dzdQUmxjUHdJb00tQnB3RXR4U1otNGY5bEtucll2aE1aYm1IYjQxbGx4SERHVWtEMGt0dHE3d2NPazd5QUdGSVdWSldkdkt5S1pRR1FSdnVud2M0ZjJzQXRjX1pkSTBieVVnZ2l1MUNLNFgwNlBOUFFpYjlRT1FvVms2UlhRS0REYnJ4bk1RaTRKYjhEYnZZWUxkajg9MUYxMjI1NTA=";
const toHours = 1000 * 60 * 60;
const toDays = toHours * 24;

async function amountOfIssues(cloudId) {
  const amount = await fetch(
    `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `${token}`,
      },
    }
  ).then((amount) => amount.json());

  return amount.total;
}

async function timeToFixBugs(cloudId, startAt = 0, maxResults = 100) {
  let timesToFixBugs = [];
  const issues = await fetch(
    `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?startAt=${startAt}&maxResults=${maxResults}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `${token}`,
      },
    }
  ).then((issues) => issues.json());

  for (let i = 0; i < issues.issues.length; i++) {
    const issue = issues.issues[i];

    if (issue.fields.issuetype.name === "Bug") {
      if (issue.fields.status.name === "Merged in Prod") {
        const dateCreation = new Date(issue.fields.created);
        const dateFinished = new Date(issue.fields.statuscategorychangedate);
        const timeToComplete = dateFinished - dateCreation;

        timesToFixBugs.push(timeToComplete);
      }
    }
  }

  return timesToFixBugs;
}

async function avgTimeForAllBugsToBeCorrected() {
  const loadingMTTR = document.getElementById("loadingMTTR");
  const loadingText = document.createElement("p");
  loadingText.innerText = `Lancement de l'API`;
  loadingMTTR.appendChild(loadingText);

  let allTimesToFixBugs = [];
  let sumTimesToFixBugs = 0;
  let totalOfIssues = await amountOfIssues(cloudId);

  loadingText.innerHTML = "";
  loadingText.innerText = `Récupération des données en cours... 1/${Math.ceil(
    totalOfIssues / maxResults
  )}`;

  allTimesToFixBugs = [
    ...allTimesToFixBugs,
    ...(await timeToFixBugs(cloudId, startAt, maxResults)),
  ];
  startAt += maxResults;

  for (startAt; startAt < totalOfIssues; startAt += maxResults) {
    allTimesToFixBugs = [
      ...allTimesToFixBugs,
      ...(await timeToFixBugs(cloudId, startAt, maxResults)),
    ];
    loadingText.innerHTML = "";
    loadingText.innerText = `Récupération des données en cours... ${
      startAt / maxResults
    }/${Math.ceil(totalOfIssues / maxResults)}`;
  }
  loadingMTTR.innerText = "";
  for (let i = 0; i < allTimesToFixBugs.length; i++) {
    sumTimesToFixBugs += allTimesToFixBugs[i];
  }
  const avgTimePerBug = sumTimesToFixBugs / allTimesToFixBugs.length / toHours;

  const meanTimeToRecoverKPI = document.getElementById("meanTimeToRecoverKPI");
  const meanTimeToRecoverValue = document.createElement("p");
  if (avgTimePerBug < 1) {
    meanTimeToRecoverValue.innerText = `${
      Math.round(avgTimePerBug * 100 * 60) / 100
    }min !!! 🤘🤘🤘`;
    meanTimeToRecoverKPI.style.backgroundColor = "green";
    meanTimeToRecoverKPI.style.color = "white";
  } else if (avgTimePerBug >= 1 && avgTimePerBug < 24) {
    meanTimeToRecoverValue.innerText = `${
      Math.round(avgTimePerBug * 100) / 100
    }h ! 👍`;
    meanTimeToRecoverKPI.style.backgroundColor = "green";
    meanTimeToRecoverKPI.style.color = "white";
  } else if (avgTimePerBug >= 24 && avgTimePerBug < 168) {
    meanTimeToRecoverValue.innerText = `${
      Math.round((avgTimePerBug / 24) * 100) / 100
    }j 🤷‍♂️`;
    meanTimeToRecoverKPI.style.backgroundColor = "yellow";
    meanTimeToRecoverKPI.style.color = "black";
  } else {
    meanTimeToRecoverValue.innerText = `${
      Math.round((avgTimePerBug / 24) * 100) / 100
    }j 😭`;
    meanTimeToRecoverKPI.style.backgroundColor = "red";
    meanTimeToRecoverKPI.style.color = "white";
  }

  meanTimeToRecoverKPI.appendChild(meanTimeToRecoverValue);
}

const launchJiraAPI = document.querySelector(".launchJiraAPI");
launchJiraAPI.addEventListener("click", () => avgTimeForAllBugsToBeCorrected());
