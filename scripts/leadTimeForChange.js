const cloudId = "315e7629-5056-4a70-9077-97c3637a4366";
const token =
  "Basic c3RldmUuZ2FybmVyaUB0ZWFtc3RhcnRlci5jbzpBVEFUVDN4RmZHRjBFX3pWM2RCTC1DM0FUUENaSE1lcm80dzdQUmxjUHdJb00tQnB3RXR4U1otNGY5bEtucll2aE1aYm1IYjQxbGx4SERHVWtEMGt0dHE3d2NPazd5QUdGSVdWSldkdkt5S1pRR1FSdnVud2M0ZjJzQXRjX1pkSTBieVVnZ2l1MUNLNFgwNlBOUFFpYjlRT1FvVms2UlhRS0REYnJ4bk1RaTRKYjhEYnZZWUxkajg9MUYxMjI1NTA=";
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
