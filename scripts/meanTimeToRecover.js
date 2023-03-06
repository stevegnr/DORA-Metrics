const cloudId = "315e7629-5056-4a70-9077-97c3637a4366";
let startAt = 0;
const maxResults = 100;
const token =
  "Basic c3RldmUuZ2FybmVyaUB0ZWFtc3RhcnRlci5jbzpBVEFUVDN4RmZHRjBFX3pWM2RCTC1DM0FUUENaSE1lcm80dzdQUmxjUHdJb00tQnB3RXR4U1otNGY5bEtucll2aE1aYm1IYjQxbGx4SERHVWtEMGt0dHE3d2NPazd5QUdGSVdWSldkdkt5S1pRR1FSdnVud2M0ZjJzQXRjX1pkSTBieVVnZ2l1MUNLNFgwNlBOUFFpYjlRT1FvVms2UlhRS0REYnJ4bk1RaTRKYjhEYnZZWUxkajg9MUYxMjI1NTA=";
const toHours = 1000 * 60 * 60;
const toDays = toHours * 24;

//Data for leadTimeForChange
let issuesMergedInProd = [];

// Récupère les 100 premiers tickets et renvoie leur nombre total
async function amountOfIssues() {
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

// Récupère le changelog du projet
async function changelog(issueKey) {
  const changelog = await fetch(
    `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${issueKey}/changelog`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `${token}`,
      },
    }
  ).then((changelog) => changelog.json());

  return changelog;
}

// Récupère le temps de résolution de chaque bug
async function timeToFixBugs(startAt = 0, maxResults = 100) {
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

    if (issue.fields.status.name === "Merged in Prod") {
      //Data for leadTimeForChange
      issuesMergedInProd.push(issue.key);

      //meanTimeToRecover
      if (issue.fields.issuetype.name === "Bug") {
        const dateCreation = new Date(issue.fields.created);
        const dateFinished = new Date(issue.fields.statuscategorychangedate);
        const timeToComplete = dateFinished - dateCreation;

        timesToFixBugs.push(timeToComplete);
      }
    }
  }

  return timesToFixBugs;
}

// Calcule le temps moyen de correction des bugs et affiche dans le KPI
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
    ...(await timeToFixBugs(startAt, maxResults)),
  ];
  startAt += maxResults;

  for (startAt; startAt < totalOfIssues; startAt += maxResults) {
    allTimesToFixBugs = [
      ...allTimesToFixBugs,
      ...(await timeToFixBugs(startAt, maxResults)),
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

  leadTimeForChange(issuesMergedInProd);
}

// Récupère le délai d'exécution des changements
async function leadTimeForChange(issuesKey) {
  let dateCodeReview;
  let dateMergedInProd;
  let timeForChangeMs = 0;
  let totalOfTimesForChangeMs = 0;
  let timeForChangeMsLength = 0;

  console.log(issuesKey);
  for (let incr = 0; incr < issuesKey.length; incr++) {
    dateCodeReview = null;
    dateMergedInProd = null;

    const changelogOfAnIssue = await changelog(issuesKey[incr]);

    for (let i = 0; i < changelogOfAnIssue.values.length; i++) {
      if (changelogOfAnIssue.values[i].items[0].toString === "To Code Review") {
        dateCodeReview = new Date(changelogOfAnIssue.values[i].created);
      } else if (
        changelogOfAnIssue.values[i].items[0].toString === "Merged in Prod"
      ) {
        dateMergedInProd = new Date(changelogOfAnIssue.values[i].created);
      }
    }
    if (dateCodeReview !== null && dateMergedInProd !== null) {
      timeForChangeMs = dateMergedInProd - dateCodeReview;
      totalOfTimesForChangeMs += timeForChangeMs;
      timeForChangeMsLength++;
    }
    console.log({
      issueKey: issuesKey[incr],
      dateCodeReview,
      dateMergedInProd,
      timeForChangeMs,
      totalOfTimesForChangeMs,
      timeForChangeMsLength,
    });
  }

  let avgLeadTimeForChange = totalOfTimesForChangeMs / timeForChangeMsLength;

  let avgLeadTimeForChangeDays = avgLeadTimeForChange / toDays;

  console.log(Math.round(avgLeadTimeForChange * 100) / 100);

  const leadTimeForChangeKPI = document.getElementById("leadTimeForChangeKPI");
  const leadTimeForChangeValue = document.createElement("p");
  if (avgLeadTimeForChangeDays < 1) {
    leadTimeForChangeValue.innerText = `${
      Math.round(avgLeadTimeForChangeDays * 100) / 100
    }j !!! 🤘🤘🤘`;
    leadTimeForChangeKPI.style.backgroundColor = "green";
    leadTimeForChangeKPI.style.color = "white";
  } else if (avgLeadTimeForChangeDays >= 1 && avgLeadTimeForChangeDays < 7) {
    leadTimeForChangeValue.innerText = `${
      Math.round(avgLeadTimeForChangeDays * 100) / 100
    }j ! 👍`;
    leadTimeForChangeKPI.style.backgroundColor = "green";
    leadTimeForChangeKPI.style.color = "white";
  } else if (avgLeadTimeForChangeDays >= 7 && avgLeadTimeForChangeDays < 30.4) {
    leadTimeForChangeValue.innerText = `${
      Math.round(avgLeadTimeForChangeDays * 100) / 100
    }j 🤷‍♂️`;
    leadTimeForChangeKPI.style.backgroundColor = "yellow";
    leadTimeForChangeKPI.style.color = "black";
  } else {
    leadTimeForChangeValue.innerText = `${
      Math.round(avgLeadTimeForChangeDays * 100) / 100
    }j 😭`;
    leadTimeForChangeKPI.style.backgroundColor = "red";
    leadTimeForChangeKPI.style.color = "white";
  }

  leadTimeForChangeKPI.appendChild(leadTimeForChangeValue);
}

const launchMeanTimeToRecoverAPI = document.querySelector(
  ".meanTimeToRecoverAPI"
);
launchMeanTimeToRecoverAPI.addEventListener("click", () =>
  avgTimeForAllBugsToBeCorrected()
);
