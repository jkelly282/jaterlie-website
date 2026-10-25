// Address of your API Gateway route (from the HTTP API's Invoke URL)
const RSVP_URL = "https://ujnuyi46kd.execute-api.eu-west-2.amazonaws.com/rsvp";

const form = document.getElementById("rsvp-form");
const status = document.getElementById("rsvp-status");
const button = document.getElementById("rsvp-submit");
const guestsField = document.getElementById("guests-field");

function say(message, kind) {
  status.textContent = message;
  status.className = kind || "";
}

// Only ask for a head count if they're coming
form.addEventListener("change", () => {
  const attending = form.elements["attending"].value;
  guestsField.hidden = attending !== "yes";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  say("");

  // Bots tend to fill in the hidden field; pretend all is well and do nothing
  if (form.elements["website"].value) {
    say("Thank you, your reply has been sent.", "success");
    return;
  }

  const name = form.elements["name"].value.trim();
  const email = form.elements["email"].value.trim();
  const attending = form.elements["attending"].value;

  if (!name) return say("Please enter your name.", "error");
  if (!/^\S+@\S+\.\S+$/.test(email)) return say("Please enter a valid email address.", "error");
  if (!attending) return say("Please tell us whether you can come.", "error");

  const payload = {
    name,
    email,
    attending: attending === "yes",
    guests: attending === "yes" ? Number(form.elements["guests"].value) || 1 : 1,
    dietary: form.elements["dietary"].value.trim(),
  };

  button.disabled = true;
  say("Sending…");

  try {
    const response = await fetch(RSVP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      form.hidden = true;
      status.className = "success";
      status.textContent = payload.attending
        ? "Thank you! We can’t wait to celebrate with you."
        : "Thank you for letting us know. We’ll miss you.";
      // The status line lives inside the form, so move it out to stay visible
      form.parentNode.appendChild(status);
    } else if (response.status === 429) {
      say("Lots of replies are arriving at once. Please try again in a moment.", "error");
    } else if (response.status === 400) {
      say("Something in the form wasn’t quite right. Please check your name and email.", "error");
    } else {
      say("Sorry, something went wrong on our side. Please try again shortly.", "error");
    }
  } catch (err) {
    say("We couldn’t reach the server. Please check your connection and try again.", "error");
  } finally {
    button.disabled = false;
  }
});
