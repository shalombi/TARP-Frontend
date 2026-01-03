# Frontend Testing Guide - Experiment Runs

## 🎯 Overview

The Experiment Runs feature is now available in the frontend! You can:
- View experiment details with runs
- Create new experiment runs
- View lineage graphs
- See run status, parameters, metrics, and artifacts

---

## 🚀 Quick Start

### 1. Navigate to Experiments Page

1. Open your browser and go to: `http://localhost:3000/experiments`
2. Login if needed (use `admin@tarp.local` / `admin`)

### 2. Click on an Experiment

- Click on any experiment title (it's now a clickable link)
- You'll be taken to: `/experiments/[id]`

### 3. View Experiment Runs

On the experiment detail page, you'll see:
- **Runs Tab** (default): List of all experiment runs
- **Lineage Tab**: Visual graph of experiment relationships

---

## 📋 Features to Test

### ✅ Feature 1: View Experiment Runs

**Steps:**
1. Go to `/experiments`
2. Click on any experiment
3. You should see the "Runs" tab with a list of runs

**Expected:**
- List of runs (or empty state if no runs exist)
- Each run shows:
  - Status badge (QUEUED, RUNNING, SUCCESS, FAILED, CANCELED)
  - Run ID (shortened)
  - Git commit SHA (if provided)
  - Created by and date

**Click on a run** to expand and see:
- Parameters (JSON)
- Metrics (JSON)
- Input/Output artifacts
- Logs (if available)

---

### ✅ Feature 2: Create New Run

**Steps:**
1. On experiment detail page, click **"+ Create Run"** button
2. Fill in the form:
   - Status: Select from dropdown (QUEUED, RUNNING, SUCCESS, etc.)
   - Git Commit SHA: Optional (e.g., `abc123def456`)
   - Branch: Optional (e.g., `main`)
   - Parameters JSON: Optional (e.g., `{"learning_rate": 0.001, "batch_size": 32}`)
3. Click **"Create Run"**

**Expected:**
- Modal closes
- New run appears in the list
- Run has the status you selected

**Test Cases:**
- ✅ Create with all fields filled
- ✅ Create with only status (minimal)
- ✅ Create with invalid JSON in parameters → Should show error
- ✅ Cancel button closes modal without creating

---

### ✅ Feature 3: View Lineage Graph

**Steps:**
1. On experiment detail page, click **"Lineage"** tab
2. Wait for lineage to load

**Expected:**
- Graph statistics (nodes count, edges count)
- List of nodes (experiment, runs, artifacts)
- List of relationships (edges)

**Test Cases:**
- ✅ Empty experiment (no runs) → Shows "No lineage data"
- ✅ Experiment with runs → Shows nodes and edges
- ✅ Click between tabs → Data persists

---

### ✅ Feature 4: Run Details

**Steps:**
1. Click on any run card to expand it
2. View details:
   - Parameters section (if paramsJson exists)
   - Metrics section (if metricsJson exists)
   - Artifacts section (if artifacts linked)
   - Logs section (if logs exist)

**Expected:**
- All sections render correctly
- JSON is formatted nicely
- Artifact links work (click to go to artifacts page)
- Logs are displayed in monospace font

---

## 🎨 UI Elements to Check

### Status Badges
- **QUEUED**: Yellow background (`#fef3c7`)
- **RUNNING**: Blue background (`#dbeafe`)
- **SUCCESS**: Green background (`#d1fae5`)
- **FAILED**: Red background (`#fee2e2`)
- **CANCELED**: Gray background (`#f3f4f6`)

### Tabs
- **Runs Tab**: Shows list of runs
- **Lineage Tab**: Shows graph visualization
- Active tab has blue underline and bold text

### Modal
- **Create Run Modal**: 
  - Dark overlay background
  - White card in center
  - Form with all fields
  - Cancel and Create buttons

---

## 🐛 Common Issues & Fixes

### Issue: "Failed to load experiment"
**Fix:** 
- Check backend is running (`http://localhost:3001/health`)
- Check you're logged in
- Check experiment ID is valid

### Issue: "Failed to create run"
**Fix:**
- Check JSON syntax in Parameters field
- Check you have access to the experiment's lab
- Check backend logs for detailed error

### Issue: "No lineage data"
**Fix:**
- This is normal if experiment has no runs
- Create a run first, then check lineage

### Issue: "Runs not showing"
**Fix:**
- Check network tab for API errors
- Verify backend endpoint: `GET /experiments/:id/runs`
- Check console for errors

---

## 📊 API Endpoints Used

The frontend calls these endpoints:

1. **GET** `/experiments/:id` - Get experiment details
2. **GET** `/experiments/:id/runs` - List runs
3. **POST** `/experiments/:id/runs` - Create run
4. **GET** `/experiments/:id/lineage` - Get lineage graph
5. **GET** `/experiment-runs/:runId` - Get run details (if needed)

---

## ✅ Testing Checklist

- [ ] Can navigate to experiment detail page
- [ ] Can see runs list (or empty state)
- [ ] Can create new run
- [ ] Can view run details (expand/collapse)
- [ ] Can switch to Lineage tab
- [ ] Can see lineage graph (if runs exist)
- [ ] Status badges show correct colors
- [ ] JSON fields format correctly
- [ ] Artifact links work
- [ ] Modal opens and closes correctly
- [ ] Error messages show when needed
- [ ] Loading states work (Loader component)

---

## 🎬 Demo Flow

1. **Login** → `/auth/login`
2. **Go to Experiments** → `/experiments`
3. **Click experiment** → `/experiments/[id]`
4. **Create run** → Click "+ Create Run" → Fill form → Submit
5. **View run** → Click on run card → See details
6. **View lineage** → Click "Lineage" tab → See graph
7. **Navigate back** → Click "← Back to Experiments"

---

## 🚨 Known Limitations

1. **No Update Run UI**: Currently, you can only create runs. Updating runs requires API calls directly.
2. **No Delete Run**: Delete functionality not implemented in UI.
3. **Simple Lineage View**: Lineage is shown as lists, not a visual graph (future enhancement).
4. **No Artifact Selection**: When creating a run, you can't select artifacts from UI (use API directly).

---

## 🔮 Future Enhancements

- [ ] Visual graph for lineage (using D3.js or similar)
- [ ] Update run status from UI
- [ ] Delete run from UI
- [ ] Select artifacts when creating run
- [ ] Filter runs by status
- [ ] Search runs
- [ ] Export run data
- [ ] Compare runs side-by-side

---

**Happy Testing!** 🎉

