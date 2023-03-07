const apiURL = "https://api.github.com";
const owner = "teamstarter";
const repo = "teamstarter";
const token =
  "token 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";

async function getDeploiments() {
  const deploiments = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/elasticbeanstalk_production.yml/runs`,
    {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: token,
      },
    }
  ).then((deploiments) => deploiments.json());

  return deploiments;
}

async function deploymentFrequency() {
  let deploiments = await getDeploiments();
  let lastCreated;
  let firstCreated;
  let toHours = 1000 * 60 * 60;

  for (let i = 0; i < deploiments.workflow_runs.length; i++) {
    let deploiment = deploiments.workflow_runs[i];

    let created_at = new Date(deploiment.created_at);

    if (i === 0) {
      lastCreated = created_at;
    } else if (i === deploiments.workflow_runs.length - 1) {
      firstCreated = created_at;
    }
  }
  let amountOfDeploiments = deploiments.workflow_runs.length;
  let periodms = lastCreated - firstCreated;
  let periodDays = periodms / (toHours * 24);
  let deploysPerDay = amountOfDeploiments / periodDays;
  let deploysPerWeek = (amountOfDeploiments * 7) / periodDays;
  let timeForOneDeploy = 1 / deploysPerDay;

  const deploymentFrequencyKPI = document.getElementById(
    "deploymentFrequencyKPI"
  );
  const deploymentFrequencyValue = document.createElement("p");
  if (deploysPerDay > 1) {
    deploymentFrequencyValue.innerText = `${
      Math.round(deploysPerDay * 10) / 10
    } deploiments per day 🚀`;
    deploymentFrequencyKPI.style.backgroundColor = "green";
    deploymentFrequencyKPI.style.color = "white";
  } else if (deploysPerDay <= 1 && deploysPerWeek >= 1) {
    deploymentFrequencyValue.innerText = `${
      Math.round(10 * deploysPerWeek) / 10
    } deploiments per week ! 👍`;
    deploymentFrequencyKPI.style.backgroundColor = "green";
    deploymentFrequencyKPI.style.color = "white";
  } else if (deploysPerWeek < 1 && deploysPerDay * 30.4 >= 1) {
    deploymentFrequencyValue.innerText = `${
      Math.round(10 * deploysPerWeek) / 10
    } deploiments per week 🤷‍♂️`;
    deploymentFrequencyKPI.style.backgroundColor = "yellow";
    deploymentFrequencyKPI.style.color = "black";
  } else {
    deploymentFrequencyValue.innerText = `${
      Math.round(10 * deploysPerWeek) / 10
    } deploiments per week 💩`;
    deploymentFrequencyKPI.style.backgroundColor = "red";
    deploymentFrequencyKPI.style.color = "white";
  }

  deploymentFrequencyKPI.appendChild(deploymentFrequencyValue);
}

const launchDeploymentFrequencyAPI = document.querySelector(
  ".launchDeploymentFrequencyAPI"
);
launchDeploymentFrequencyAPI.addEventListener("click", () =>
  deploymentFrequency()
);
