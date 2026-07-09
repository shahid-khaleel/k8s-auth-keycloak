const message = document.querySelector("#message");
const meta = document.querySelector("#meta");
const refresh = document.querySelector("#refresh");
const executeForm = document.querySelector("#execute-form");
const functionInput = document.querySelector("#function-input");
const functionOutput = document.querySelector("#function-output");
const execute = document.querySelector("#execute");
const authStatus = document.querySelector("#auth-status");
const authMeta = document.querySelector("#auth-meta");
const signIn = document.querySelector("#sign-in");
const signOut = document.querySelector("#sign-out");

let authenticated = false;

function setAuthState(user) {
  authenticated = Boolean(user);
  execute.disabled = !authenticated;
  signIn.hidden = authenticated;
  signOut.hidden = !authenticated;

  if (authenticated) {
    authStatus.textContent = `Signed in as ${user.username}`;
    authMeta.textContent = user.email || user.name || "Keycloak user validated by backend";
    functionOutput.textContent = "Ready to run protected backend logic.";
  } else {
    authStatus.textContent = "Not signed in";
    authMeta.textContent = "Use Keycloak before running the protected function.";
    functionOutput.textContent = "Sign in first.";
  }
}

async function loadGreeting() {
  refresh.disabled = true;
  message.textContent = "Loading...";
  meta.textContent = "";

  try {
    const response = await fetch("/api/greeting");

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    message.textContent = data.message;
    meta.textContent = `${data.service} responded at ${new Date(data.timestamp).toLocaleString()}`;
  } catch (error) {
    message.textContent = "Could not reach the backend";
    meta.textContent = error.message;
  } finally {
    refresh.disabled = false;
  }
}

async function loadSession() {
  try {
    const response = await fetch("/api/me");

    if (response.status === 401) {
      setAuthState(null);
      return;
    }

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    setAuthState(await response.json());
  } catch (error) {
    authenticated = false;
    authStatus.textContent = "Could not check session";
    authMeta.textContent = error.message;
    execute.disabled = true;
  }
}

async function runBackendFunction(event) {
  event.preventDefault();

  if (!authenticated) {
    window.location.href = "/oauth2/authorization/keycloak";
    return;
  }

  execute.disabled = true;
  functionOutput.textContent = "Running backend function...";

  try {
    const response = await fetch("/api/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: functionInput.value,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    functionOutput.textContent = `${data.result}. User ${data.authenticatedUser} validated. Task ${data.taskId.slice(0, 8)} completed at ${new Date(data.timestamp).toLocaleTimeString()}.`;
  } catch (error) {
    functionOutput.textContent = `Function failed: ${error.message}`;
  } finally {
    execute.disabled = !authenticated;
  }
}

refresh.addEventListener("click", loadGreeting);
executeForm.addEventListener("submit", runBackendFunction);
signIn.addEventListener("click", () => {
  window.location.href = "/oauth2/authorization/keycloak";
});
signOut.addEventListener("click", () => {
  window.location.href = "/logout";
});
loadGreeting();
loadSession();
