/**
 * include.js
 * Dynamically loads reusable HTML components like sidebar.html
 * Usage in any page:
 *   <div data-include="sidebar.html"></div>
 *   <script src="include.js"></script>
 */

document.addEventListener("DOMContentLoaded", () => {
  const includeElements = document.querySelectorAll("[data-include]");

  includeElements.forEach(el => {
    const file = el.getAttribute("data-include");
    if (!file) return;

    fetch(file)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load ${file}: ${response.statusText}`);
        }
        return response.text();
      })
      .then(data => {
        el.innerHTML = data;

        // Optional: re-run includes inside included file (nested includes)
        const nestedElements = el.querySelectorAll("[data-include]");
        nestedElements.forEach(nestedEl => {
          const nestedFile = nestedEl.getAttribute("data-include");
          if (nestedFile) {
            fetch(nestedFile)
              .then(res => res.text())
              .then(nestedData => (nestedEl.innerHTML = nestedData));
          }
        });
      })
      .catch(err => {
        console.error(err);
        el.innerHTML = `<p style="color:red;">Error loading ${file}</p>`;
      });
  });
});
