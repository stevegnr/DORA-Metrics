const cloudId = "" //CONFIDENTIAL
const token = "" //CONFIDENTIAL
const toHours = 1000 * 60 * 60;
const toDays = toHours * 24;

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

export async function leadTimeForChange(issueKey) {
  const changelogOfAnIssue = await changelog(issueKey);
  let dateCodeReview;
  let dateMergedInProd;
  let timeForChangeMs;
  let totalOfTimesForChangeMs;
  let timeForChangeMsLength;

  for (let i = 0; i < changelogOfAnIssue.values.length; i++) {
    if (changelogOfAnIssue.values[i].items[0].toString === "To Code Review") {
      dateCodeReview = new Date(changelogOfAnIssue.values[i].created);
    } else if (
      changelogOfAnIssue.values[i].items[0].toString === "Merged in Prod"
    ) {
      dateMergedInProd = new Date(changelogOfAnIssue.values[i].created);
    }
    timeForChangeMs = dateMergedInProd - dateCodeReview;
    totalOfTimesForChangeMs += timeForChangeMs;
    timeForChangeMsLength++;
  }

  let avgLeadTimeForChange = totalOfTimesForChangeMs / timeForChangeMsLength;

  let avgLeadTimeForChangeDays = timeForChangeMs / toDays;

  const leadTimeForChangeKPI = document.getElementById("leadTimeForChangeKPI");
  const leadTimeForChangeValue = document.createElement("p");
  if (avgLeadTimeForChangeDays < 1) {
    leadTimeForChangeValue.innerText = `${
      Math.round(avgLeadTimeForChangeDays * 100 * 60) / 100
    }j !!! 🚀`;
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
      Math.round((avgLeadTimeForChangeDays / 24) * 100) / 100
    }j 🤷‍♂️`;
    leadTimeForChangeKPI.style.backgroundColor = "yellow";
    leadTimeForChangeKPI.style.color = "black";
  } else {
    leadTimeForChangeValue.innerText = `${
      Math.round((avgLeadTimeForChangeDays / 24) * 100) / 100
    }j 💩`;
    leadTimeForChangeKPI.style.backgroundColor = "red";
    leadTimeForChangeKPI.style.color = "white";
  }

  leadTimeForChangeKPI.appendChild(leadTimeForChangeValue);
}
