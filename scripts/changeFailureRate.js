const owner = "" //CONFIDENTIEL
const repo = "" //CONFIDENTIEL
const token =
  "" //CONFIDENTIEL

async function getChangelog() {
  const changelog = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/CHANGELOG.md`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: token,
      },
    }
  ).then((changelog) => changelog.json());

  return changelog;
}

async function changeFailureRate() {
  const changelog = await getChangelog();
  const content = changelog.content;
  const changelogSplitted = content.split(/\r?\n/).join("");
  const changelogDecoded = atob(changelogSplitted);
  let arrayOfTags = [];
  arrayOfTags = changelogDecoded.split("\n## ");

  let totalOfBugs = 0;
  let totalOfCodeChanges = 0;

  for (let i = 0; i < arrayOfTags.length; i++) {
    const detailOfTag = arrayOfTags[i].split("### ");

    let qtyOfFeatures = 0;
    let qtyOfBugFixes = 0;
    for (let j = 0; j < detailOfTag.length; j++) {
      if (detailOfTag[j].startsWith("Features")) {
        for (let h = 0; h < detailOfTag[j].split("\n").length; h++) {
          if (
            detailOfTag[j].split("\n")[h].includes("**") ||
            detailOfTag[j].split("\n")[h].includes("DP-")
          )
            qtyOfFeatures++;
        }
      } else if (detailOfTag[j].startsWith("Bug Fixes")) {
        for (let h = 0; h < detailOfTag[j].split("\n").length; h++) {
          if (
            detailOfTag[j].split("\n")[h].includes("**") ||
            detailOfTag[j].split("\n")[h].includes("DP-")
          )
            qtyOfBugFixes++;
        }
      }

      totalOfBugs += qtyOfBugFixes;
      totalOfCodeChanges = totalOfCodeChanges + (qtyOfBugFixes + qtyOfFeatures);
    }
  }
  let ratio = Math.round((100 * totalOfBugs) / totalOfCodeChanges);

  const changeFailureRateKPI = document.getElementById("changeFailureRateKPI");
  const changeFailureRateValue = document.createElement("p");
  if (ratio <= 15) {
    changeFailureRateValue.innerText = `${ratio}% !!! 🚀`;
    changeFailureRateKPI.style.backgroundColor = "green";
    changeFailureRateKPI.style.color = "white";
  } else if (ratio > 15 && ratio <= 30) {
    changeFailureRateValue.innerText = `${ratio}% ! 👍`;
    changeFailureRateKPI.style.backgroundColor = "green";
    changeFailureRateKPI.style.color = "white";
  } else if (ratio > 30 && ratio <= 45) {
    changeFailureRateValue.innerText = `${ratio}% 🤷‍♂️`;
    changeFailureRateKPI.style.backgroundColor = "yellow";
    changeFailureRateKPI.style.color = "black";
  } else {
    changeFailureRateValue.innerText = `${ratio}% 💩`;
    changeFailureRateKPI.style.backgroundColor = "red";
    changeFailureRateKPI.style.color = "white";
  }

  changeFailureRateKPI.appendChild(changeFailureRateValue);
}

const launchChangeFailureRate = document.querySelector(
  ".launchChangeFailureRate"
);
launchChangeFailureRate.addEventListener("click", () => changeFailureRate());
