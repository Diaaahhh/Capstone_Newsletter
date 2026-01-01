document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:5000/api/drafts";
  const form = document.getElementById("createResearchGrantForm");
  const draftBtn = document.querySelector(".draft-btn");
  const harvardRefDiv = document.getElementById("harvardRef");

  // Get userEmail from localStorage
  const userEmail = localStorage.getItem("userEmail");

  if (!userEmail) {
    alert("You need to be logged in to save a draft.");
    window.location.href = "loginPage.html"; // Redirect to login if not logged in
    return;
  }

  // Clear leftover draft data if creating new
  const urlParams = new URLSearchParams(window.location.search);
  const isNewDraft = urlParams.get("new") === "true";
  if (isNewDraft) {
    localStorage.removeItem("isEditingDraft");
    localStorage.removeItem("currentDraft");
    localStorage.removeItem("currentDraftId");
  }

  // Check edit mode
  const isEditMode = localStorage.getItem("isEditingDraft") === "true";
  const savedDraft = localStorage.getItem("currentDraft");

  function populateFormFromData(data = {}) {
    document.getElementById("grantSource").value = data.grantSource || "";
    document.getElementById("grantAmount").value = data.grantAmount || "";
    document.getElementById("researchTopic").value = data.researchTopic || "";
    document.getElementById("year").value = data.year || "";

    const container = document.getElementById("researchTeamContainer");
    container.innerHTML = "";
    if (Array.isArray(data.members) && data.members.length) {
      data.members.forEach((m) => addMemberUI(m.name, m.designation, m.department));
    } else {
      addMemberUI();
    }

    // Populate Harvard Reference if exists
    if (data.harvardRef) harvardRefDiv.innerHTML = data.harvardRef;
    else updateHarvardReference();
  }

  // --------------------------
  // Load draft if in edit mode
  // --------------------------
  if (isEditMode && savedDraft) {
    try {
      const draft = JSON.parse(savedDraft);
      populateFormFromData(draft.formData || {});
      console.log("✅ Draft loaded into form for editing.");
    } catch (err) {
      console.error("Failed to load draft:", err);
      Toast.error("Error loading draft. Please try again.");
    }
  }

  // --------------------------
  // Setup submission view for "Under Review" cards
  // --------------------------
  setupSubmissionView({
    category: "researchGrant",
    formElement: form,
    extraDisableElements: [draftBtn],
    onDataReady: (data) => {
      populateFormFromData(data || {});
    },
  });

  // --------------------------
  // Add member UI
  // --------------------------
  function addMemberUI(name = "", designation = "", department = "") {
    const member = document.createElement("div");
    member.classList.add("research-member", "border", "rounded", "p-3", "mb-3");

    member.innerHTML = `
      <div class="row">
        <div class="col-md-4 mb-3">
          <label class="form-label">Full Name *</label>
          <input type="text" class="form-control member-name" value="${name}" required />
        </div>
        <div class="col-md-4 mb-3">
          <label class="form-label">Designation *</label>
          <input type="text" class="form-control member-designation" value="${designation}" required />
        </div>
        <div class="col-md-3 mb-3">
          <label class="form-label">Department *</label>
          <select class="form-select member-department" required>
            <option value="">Select Department</option>
            <option ${department === "Computer Science and Engineering (CSE)" ? "selected" : ""}>Computer Science and Engineering (CSE)</option>
            <option ${department === "Electrical and Electronic Engineering (EEE)" ? "selected" : ""}>Electrical and Electronic Engineering (EEE)</option>
            <option ${department === "Pharmacy" ? "selected" : ""}>Pharmacy</option>
            <option ${department === "Business Administration (BBA)" ? "selected" : ""}>Business Administration (BBA)</option>
            <option ${department === "Economics" ? "selected" : ""}>Economics</option>
            <option ${department === "English" ? "selected" : ""}>English</option>
            <option ${department === "Law" ? "selected" : ""}>Law</option>
            <option ${department === "Sociology" ? "selected" : ""}>Sociology</option>
            <option ${department === "Civil Engineering" ? "selected" : ""}>Civil Engineering</option>
            <option ${department === "Architecture" ? "selected" : ""}>Architecture</option>
            <option ${department === "Journalism and Media Studies" ? "selected" : ""}>Journalism and Media Studies</option>
            <option ${department === "Mathematical and Physical Sciences" ? "selected" : ""}>Mathematical and Physical Sciences</option>
          </select>
        </div>
        <div class="col-md-1 d-flex align-items-end">
          <button type="button" class="btn btn-danger btn-sm remove-member">X</button>
        </div>
      </div>
    `;

    member.querySelector(".remove-member").onclick = () => member.remove();
    document.getElementById("researchTeamContainer").appendChild(member);
  }

  const addMemberBtn = document.getElementById("addMemberBtn");
  if (addMemberBtn) addMemberBtn.addEventListener("click", () => addMemberUI());

  // --------------------------
  // Auto-generate Harvard reference
  // --------------------------
  function updateHarvardReference() {
    const topic = document.getElementById("researchTopic")?.value.trim() || "[Topic]";
    const source = document.getElementById("grantSource")?.value.trim() || "[Source]";
    const amount = document.getElementById("grantAmount")?.value.trim() || "[Amount]";
    const year = document.getElementById("year")?.value.trim() || "[Year]";

    // Collect all member details
    const memberDivs = document.querySelectorAll(".research-member");
    const members = Array.from(memberDivs)
      .map((div) => ({
        name: div.querySelector(".member-name")?.value.trim(),
        designation: div.querySelector(".member-designation")?.value.trim(),
        department: div.querySelector(".member-department")?.value.trim(),
      }))
      .filter((m) => m.name); // remove empty names

    if (members.length === 0) {
      harvardRefDiv.innerHTML = "";
      return;
    }

    let authorText = "";
    const isPlural = members.length > 1;
    const verb = isPlural ? "have" : "has";

    // Format amount (add "Taka" if it's just a number)
    const formattedAmount = isNaN(amount) ? amount : `Taka ${Number(amount).toLocaleString()}`;

    // Check if all members are from the same department
    const firstDept = members[0].department;
    const allSameDept = members.length > 0 && members.every((m) => m.department === firstDept);

    if (members.length === 1) {
      // Single Author: "Name, Designation, Department of X"
      const m = members[0];
      authorText = `${m.name}, ${m.designation} of the Department of ${m.department}`;
    } else if (allSameDept) {
      // Multiple Authors, Same Dept: "Name (Desig) and Name (Desig) of the Department of X"
      const names = members.map((m) => `${m.name} (${m.designation})`).join(" and ");
      authorText = `${names} of the Department of ${firstDept}`;
    } else {
      // Mixed Depts: "Name (Desig, Dept) and Name (Desig, Dept)"
      authorText = members
        .map((m) => `${m.name} (${m.designation}, Department of ${m.department})`)
        .join(" and ");
    }

    // Construct the paragraph
    // Sentence 1: [Authors] [has/have] received a research grant of [Amount] from [Source] in the financial year [Year].
    // Sentence 2: The title of the project is “[Topic]”.
    harvardRefDiv.innerHTML = `${authorText} ${verb} received a research grant of ${formattedAmount} from the ${source} in the financial year ${year}. The title of the project is “${topic}”.`;
  }


  // Update Harvard reference on input changes
  ["researchTopic", "grantSource", "grantAmount", "year"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", updateHarvardReference);
  });

  // --------------------------
  // SAVE AS DRAFT
  // --------------------------
  draftBtn.addEventListener("click", async () => {
    const grantSource = document.getElementById("grantSource")?.value.trim() || "";
    const grantAmount = document.getElementById("grantAmount")?.value.trim() || "";
    const researchTopic = document.getElementById("researchTopic")?.value.trim() || "";
    const year = document.getElementById("year")?.value.trim() || "";

    const members = Array.from(document.querySelectorAll(".research-member")).map(div => ({
      name: div.querySelector(".member-name")?.value.trim() || "",
      designation: div.querySelector(".member-designation")?.value.trim() || "",
      department: div.querySelector(".member-department")?.value.trim() || "",
    })).filter(m => m.name && m.designation && m.department);

    // Upload photo if selected
    let photoUrl = "";
    try {
      photoUrl = await uploadImageFromInput("researchPhoto") || "";
    } catch (error) {
      console.error("Photo upload failed:", error);
      alert("⚠️ Photo upload failed, but draft will be saved without the photo.");
    }

    const harvardRef = harvardRefDiv.innerHTML;

    const formData = { grantSource, grantAmount, researchTopic, year, members, harvardRef, photo: photoUrl, date: new Date().toISOString() };

    try {
      const currentDraftId = localStorage.getItem("currentDraftId");
      if (isEditMode && currentDraftId) {
        await fetch(`${API_BASE}/${currentDraftId}`, { method: "DELETE" }).catch(console.warn);
        localStorage.removeItem("isEditingDraft");
        localStorage.removeItem("currentDraft");
        localStorage.removeItem("currentDraftId");
      }

      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "ResearchGrant", formData, createdBy: userEmail })
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      Toast.success("Research Grant draft saved successfully!");
        setTimeout(() => {
          window.location.href = "draftsVC.html";
        }, 1500);
    } catch (err) {
      console.error("Error saving draft:", err);
      Toast.error("Failed to save draft. Check your server connection.");
    }
  });

  // --------------------------
  // SUBMIT FOR REVIEW
  // --------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const grantSource = document.getElementById("grantSource")?.value.trim();
    const grantAmount = document.getElementById("grantAmount")?.value.trim();
    const researchTopic = document.getElementById("researchTopic")?.value.trim();
    const year = document.getElementById("year")?.value.trim();

    if (!grantSource || !researchTopic || !year) {
      Toast.error("Please fill in all required fields marked with *");
      return;
    }

    const members = Array.from(document.querySelectorAll(".research-member")).map(div => ({
      name: div.querySelector(".member-name")?.value.trim() || "",
      designation: div.querySelector(".member-designation")?.value.trim() || "",
      department: div.querySelector(".member-department")?.value.trim() || "",
    })).filter(m => m.name && m.designation && m.department);

    if (members.length === 0) {
      Toast.error("Please add at least one research team member.");
      return;
    }

    // Upload photo if selected
    let photoUrl = "";
    try {
      photoUrl = await uploadImageFromInput("researchPhoto") || "";
    } catch (error) {
      console.error("Photo upload failed:", error);
      alert("❌ Photo upload failed. Please try again.");
      return;
    }

    const harvardRef = harvardRefDiv.innerHTML;
    const formData = { grantSource, grantAmount, researchTopic, year, members, harvardRef, photo: photoUrl };

    try {
      const draftId = localStorage.getItem("currentDraftId");
      const res = await fetch("http://localhost:5000/api/submissions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "researchGrant", formData, createdBy: userEmail, draftId: draftId || undefined })
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      Toast.success("Research Grant submitted for review!");
      localStorage.removeItem("currentDraftId");
      localStorage.removeItem("currentDraft");
      localStorage.removeItem("isEditingDraft");
      form.reset();
      document.getElementById("researchTeamContainer").innerHTML = "";
      addMemberUI();
      updateHarvardReference();
    } catch (err) {
      console.error("Submission error:", err);
      Toast.error("Failed to submit for review.");
    }
  });

  // Initial reference generation
  updateHarvardReference();
});
