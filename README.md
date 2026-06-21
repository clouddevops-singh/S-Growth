# S-Growth: The Step-Up Portfolio & Personal Growth Dashboard

A gamified, multi-dimensional personal development tracker and professional portfolio. Instead of showing just a static resume of past achievements, **S-Growth** is a live, interactive tool that demonstrates active daily discipline, skills progression, and long-term vision.

Deployed live on GitHub Pages (inside the `/docs` directory).

---

## 🚀 Why We Built This

Most portfolio websites are static, passive, and become outdated the day they are published. **S-Growth (Step-Up Portfolio)** was built to solve this by creating a **living, proof-of-work dashboard**. 

It exists to:
1. **Showcase Active Discipline:** Prove daily commitment to habits, learning, and physical fitness using interactive trackers rather than just claiming skills.
2. **Visualize the CNCF Kubernetes Journey:** Track progress on the prestigious Cloud Native Computing Foundation (CNCF) path (KCNA ➡️ KCSA ➡️ CKAD ➡️ CKA ➡️ CKS) in real-time.
3. **Keep Goals & Vision Aligned:** Connect daily tasks with weekly, monthly, and yearly milestones alongside a 5-year strategic vision.
4. **Quantify Growth:** Provide visual charts for habits completed today, weekly trend lines, and multi-dimensional skill bars.
5. **Ensure Privacy & Ease of Hosting:** The dashboard operates entirely in the browser using `localStorage`, meaning all personal habits and goals remain completely private and stored locally on the user's device. No database or expensive backend required.

---

## 🛠️ Tech Stack & Architecture

- **Core & Structure:** Pure HTML5 (Semantic, SEO-optimized)
- **Styling & Theme:** Vanilla CSS3 featuring custom properties, sleek glassmorphism, responsive grid layouts, and custom keyframe animations. Supports both **Dark Mode** and **Light Mode**.
- **Interactive Logic:** Vanilla JavaScript (ES6) for state management, localStorage persistence, dynamic page transitions, and event handling.
- **Data Visualization:** [Chart.js](https://www.chartjs.org/) (via CDN) for loading dynamic progress rings and weekly trends.

---

## 🌟 Key Features

### 1. Growth & Habit Dashboard
- **Daily Habits Checklist:** Toggle habits as completed each day.
- **Live Stats:** Tracks current streak (🔥), percentage completed today, and total days on the journey.
- **Charts & Metrics:**
  - **Progress Ring:** Shows the exact portion of daily habits completed.
  - **Weekly Overview:** A bar chart mapping completions over the last 7 days.
- **Persistent Storage:** Automatically saves and loads your habit statuses and streaks using `localStorage`.

### 2. CNCF Kubernetes Certification Roadmap
- Visual tracker mapping the step-by-step path from Associate to Expert CNCF Certifications:
  - **Step 1:** KCNA (Kubernetes & Cloud Native Associate)
  - **Step 2:** KCSA (Kubernetes & Cloud Native Security Associate)
  - **Step 3:** CKAD (Certified Kubernetes Application Developer)
  - **Step 4:** CKA (Certified Kubernetes Administrator)
  - **Step 5:** CKS (Certified Kubernetes Security Specialist)

### 3. Multi-Dimensional Skills Portfolio
Track and visualize levels across 6 categories:
- **Technical Skills** (Python, SQL, Web Dev, System Design, etc.)
- **DevOps & Cloud** (Kubernetes, Docker, AWS, GCP, CI/CD, Monitoring, etc.)
- **Problem Solving** (Analytical Thinking, Debugging, Troubleshooting, etc.)
- **Mental focus** (Deep Work, Resilience, Mindfulness, etc.)
- **Business Skills** (Stakeholder Communication, Strategic Thinking, etc.)
- **Physical Fitness** (Endurance, Strength, Nutrition, etc.)

### 4. Interactive Goal Tracker & 5-Year Vision
- Filter goals by timeframes: **Daily**, **Weekly**, **Monthly**, and **Yearly**.
- Add new custom goals, mark them completed, or archive failed/missed ones.
- **5-Year Vision Boards** covering Career, Personal, Financial, and Business goals.
- Integrated **Daily Affirmation** generator to maintain motivation.

---

## 📁 Project Structure

```bash
Step-up/
├── docs/                     # Production builds/deployment folder
│   └── index.html            # Main portfolio and dashboard file (HTML/CSS/JS)
├── stepup-v2.html            # Alternative template/working draft version
├── stepup-website.html       # Legacy template/backup
├── stepup-v1-backup.html     # Legacy backup file
└── README.md                 # Project documentation (this file)
```

---

## ⚙️ How to Run & Customise

### Running Locally
Since this project uses client-side technologies, you can run it directly:
1. Clone this repository.
2. Open `docs/index.html` in any web browser.
3. *Alternatively*, serve it using a lightweight HTTP server:
   ```bash
   npx serve docs
   # or
   python3 -m http.server --directory docs
   ```

### Deploying to GitHub Pages
To make your dashboard accessible from anywhere:
1. Go to your repository settings on GitHub.
2. Under **Pages**, select the source branch (e.g., `growth-deploy`).
3. Set the folder to `/docs` and click **Save**.
4. Your living portfolio will be live at `https://<username>.github.io/<repository-name>/`.
