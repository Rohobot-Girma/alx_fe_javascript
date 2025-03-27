const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";
const syncInterval = 30000;
let quotes = JSON.parse(localStorage.getItem("quotes")) || [];

function showNotification(message, type = "success") {
  alert(message);

  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.style.display = "block";
  notification.style.backgroundColor = type === "error" ? "red" : "green";
  notification.style.color = "white";

  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    if (!response.ok) throw new Error("Failed to fetch from server");

    const serverQuotes = await response.json();
    return serverQuotes.map((q) => ({ text: q.title, category: "General" }));
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}

async function postQuoteToServer(quote) {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      body: JSON.stringify(quote),
      headers: { "Content-Type": "application/json" },
    });
    console.log("Quote posted to server:", quote);
  } catch (error) {
    console.error("Post Error:", error);
  }
}

async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  let localQuotes = JSON.parse(localStorage.getItem("quotes")) || [];

  const newQuotes = serverQuotes.filter(
    (sq) => !localQuotes.some((lq) => lq.text === sq.text)
  );
  if (newQuotes.length > 0) {
    localQuotes = [...localQuotes, ...newQuotes];
    localStorage.setItem("quotes", JSON.stringify(localQuotes));
    showNotification("Quotes synced with server!");
  }

  const conflicts = localQuotes.filter((lq) =>
    serverQuotes.some(
      (sq) => sq.text === lq.text && sq.category !== lq.category
    )
  );
  if (conflicts.length > 0) {
    showNotification("Conflicts detected! Server data applied.", "error");
    alert("Data conflict detected! Server data has been applied.");
    localStorage.setItem("quotes", JSON.stringify(serverQuotes));
  }
}

function showRandomQuote() {
  if (quotes.length === 0) return;
  const randomIndex = Math.floor(Math.random() * quotes.length);
  document.getElementById("quoteDisplay").textContent =
    quotes[randomIndex].text;
}

function addQuote() {
  const newQuoteText = document.getElementById("newQuoteText").value.trim();
  const newQuoteCategory = document
    .getElementById("newQuoteCategory")
    .value.trim();

  if (newQuoteText && newQuoteCategory) {
    const newQuote = { text: newQuoteText, category: newQuoteCategory };
    quotes.push(newQuote);
    saveQuotes();
    populateCategories();
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
    filterQuotes();
    postQuoteToServer(newQuote);
    alert("New quote added successfully!");
  } else {
    showNotification("Please enter both quote text and category.", "error");
    alert("Error: Please enter both quote text and category.");
  }
}

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const categories = ["All", ...new Set(quotes.map((q) => q.category))];
  categoryFilter.innerHTML = categories
    .map((cat) => `<option value="${cat}">${cat}</option>`)
    .join("");
}

function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter((q) => q.category === selectedCategory);
  document.getElementById("quoteDisplay").textContent = filteredQuotes.length
    ? filteredQuotes[0].text
    : "No quotes found";
}

function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "quotes.json";
  a.click();
  alert("Quotes exported successfully!");
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      quotes.push(...importedQuotes);
      saveQuotes();
      showNotification("Quotes imported successfully!");
      alert("Quotes imported successfully!");
    } catch (error) {
      showNotification("Invalid JSON file.", "error");
      alert("Error: Invalid JSON file."); //
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

document.getElementById("newQuote").addEventListener("click", showRandomQuote);

document.addEventListener("DOMContentLoaded", () => {
  populateCategories();
  filterQuotes();
});

setInterval(syncQuotes, syncInterval);