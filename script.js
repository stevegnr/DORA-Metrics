const cloudId = "315e7629-5056-4a70-9077-97c3637a4366";
const startAt = 0;
const maxResults = 100;
const token =
  "Basic c3RldmUuZ2FybmVyaUB0ZWFtc3RhcnRlci5jbzpBVEFUVDN4RmZHRjBFX3pWM2RCTC1DM0FUUENaSE1lcm80dzdQUmxjUHdJb00tQnB3RXR4U1otNGY5bEtucll2aE1aYm1IYjQxbGx4SERHVWtEMGt0dHE3d2NPazd5QUdGSVdWSldkdkt5S1pRR1FSdnVud2M0ZjJzQXRjX1pkSTBieVVnZ2l1MUNLNFgwNlBOUFFpYjlRT1FvVms2UlhRS0REYnJ4bk1RaTRKYjhEYnZZWUxkajg9MUYxMjI1NTA=";
/* 
async function afficherIssues(
  cloudId,
  startAt,
  maxResults,
  timeToCorrectBugs = []
) {
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
      //Récupération de l'élément du DOM qui accueillera les issues
      const sectionJira = document.querySelector(".jira");

      //Constitution d'une fiche issue
      const issueElement = document.createElement("article");
      issueElement.dataset.id = issue.id;

      //Remplissage de la fiche avec les attributs
      const issueId = document.createElement("p");
      issueId.innerText = `ID : ${issue.id}`;
      const issueKey = document.createElement("h4");
      issueKey.innerText = `Key : ${issue.key}`;

      const issueDateCreation = document.createElement("p");
      const dateCreation = new Date(issue.fields.created);
      issueDateCreation.innerText = `Créée le : ${dateCreation.toLocaleString(
        "fr-FR"
      )}`;

      const issueType = document.createElement("p");
      issueType.innerText = `Type : ${issue.fields.issuetype.name}`;

      const issueStatus = document.createElement("h4");
      issueStatus.innerText = `Statut : ${issue.fields.status.name}`;

      const issueDateFinished = document.createElement("p");
      const dateFinished = new Date(issue.fields.statuscategorychangedate);
      issueDateFinished.innerText = `Terminée le : ${dateFinished.toLocaleString(
        "fr-FR"
      )} 🤘`;

      const multiplierToHours = 1000 * 60 * 60;
      const issueTimeToComplete = document.createElement("p");
      const timeToComplete = (dateFinished - dateCreation) / multiplierToHours;

      issueTimeToComplete.innerText = `Temps de récupération : ${timeToComplete.toFixed(
        2
      )}h soit ${(timeToComplete / 24).toFixed(2)}j`;
      sectionJira.appendChild(issueElement);
      issueElement.appendChild(issueKey);
      issueElement.appendChild(issueId);
      issueElement.appendChild(issueDateCreation);
      issueElement.appendChild(issueType);
      issueElement.appendChild(issueStatus);
      if (issue.fields.status.name === "Merged in Prod") {
        issueElement.appendChild(issueDateFinished);
        issueElement.appendChild(issueTimeToComplete);
        timeToCorrectBugs.push(timeToComplete);
      }
    }
  }

  console.log(issues);

  if (issues.total > startAt + issues.maxResults) {
    afficherIssues(
      cloudId,
      startAt + issues.maxResults,
      maxResults,
      timeToCorrectBugs
    );
  }

  let sumTimeToCorrectBug = 0;
  for (let i = 0; i < timeToCorrectBugs.length; i++) {
    sumTimeToCorrectBug += timeToCorrectBugs[i];
  }

  const sectionKPI = document.querySelector(".affichageKPI");
  const indicatorJira = document.createElement("p");

  const avgTimeToComplete = sumTimeToCorrectBug / timeToCorrectBugs.length;
  if (avgTimeToComplete < 1) {
    indicatorJira.innerText = `${(avgTimeToComplete * 60).toFixed(
      2
    )}min !!! 🤘🤘🤘`;
    sectionKPI.style.backgroundColor = "green";
  } else if (avgTimeToComplete >= 1 && avgTimeToComplete < 24) {
    indicatorJira.innerText = `${avgTimeToComplete.toFixed(2)}h ! 👍 `;
    sectionKPI.style.backgroundColor = "green";
  } else if (avgTimeToComplete >= 24 && avgTimeToComplete < 168) {
    indicatorJira.innerText = `${(avgTimeToComplete / 24).toFixed(2)}j 🤷‍♂️`;
    sectionKPI.style.backgroundColor = "yellow";
  } else {
    indicatorJira.innerText = `${(avgTimeToComplete / 24).toFixed(2)}j soit ${(
      avgTimeToComplete /
      (24 * 7)
    ).toFixed(2)} semaines 😭`;
    sectionKPI.style.backgroundColor = "red";
  }
  sectionKPI.appendChild(indicatorJira);
}
const launchAPI = document.querySelector(".launchAPI");

launchAPI.addEventListener("click", () =>
  afficherIssues(cloudId, startAt, maxResults)
);
 */

async function jiraApi(cloudId, startAt, maxResults, arrayOfTimes = []) {
  let timesToFixBugs = arrayOfTimes;
  const toHours = 1000 * 60 * 60;
  const toDays = toHours * 24;

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

  console.log(issues);

  for (let i = 0; i < issues.issues.length; i++) {
    const issue = issues.issues[i];

    if (issue.fields.issuetype.name === "Bug") {
      if (issue.fields.status.name === "Merged in Prod") {
        const dateCreation = new Date(issue.fields.created);
        const dateFinished = new Date(issue.fields.statuscategorychangedate);
        const timeToComplete = (dateFinished - dateCreation) / toHours;

        timesToFixBugs.push(timeToComplete);
      }
    }
  }

  return {
    timesToFixBugs: timesToFixBugs,
    amountOfIssues: issues.total,
  };
}

async function avgTimeForAllBugsToBeCorrected(arrayOfTimes) {
  let allTimesToFixBugs = arrayOfTimes;
  let sumTimesToFixBugs = 0;
  let i = 0;
  let totalOfIssues = 0;

  do {
    allTimesToFixBugs.push(jiraApi(cloudId, i, maxResults));
    //TotalOFIssues => A récupérer de l'API
    i += maxResults;
  } while (i < totalOfIssues);

  for (let i = 0; i < allTimesToFixBugs.length; i++) {
    sumTimesToFixBugs += allTimesToFixBugs[i];
  }
  console.log(sumTimesToFixBugs / allTimesToFixBugs.length);
  return sumTimesToFixBugs / allTimesToFixBugs.length;
}
