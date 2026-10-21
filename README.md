# প্রস্তুতি — BCS mini practice exam

A mobile-first, Bengali practice exam inspired by the exam section of the supplied JobPrep BD concept. This is a standalone practice site, not an official BPSC exam or a full 200-question BCS preliminary test.

## Run locally

No dependency installation or build is required. With Python 3 installed:

```sh
cd /workspace/TEST-1
python3 -m http.server 8000 --bind 0.0.0.0
```

Open the site through your development environment's supported browser access. Serve it over HTTP; opening `index.html` directly as a file will not load JavaScript modules correctly.

With Node.js 18+ installed, `npm test` runs the question-bank, scoring, timer and saved-state checks. `npm start` starts the same Python server.

## Publish free with GitHub Pages

1. Save these project files to the `main` branch of `MahirHossain12/TEST-1` on GitHub. Keep `index.html` at the repository root.
2. For free GitHub Pages on a GitHub Free account, the repository must be **public**. Do not put private information or credentials in it.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, then **main** and **/ (root)**. Save.
5. After GitHub finishes deploying, the public address should be `https://mahirhossain12.github.io/TEST-1/`. GitHub will display the final URL in Pages settings.

No paid domain, dedicated IP, backend, database, or API key is needed. All asset paths are relative so the site works at this repository subpath. `.nojekyll` makes this a plain static site.

## Exam behavior

- 30 fixed practice questions, 5 per page, across 6 pages. The same set is used in both modes and on retries.
- 30-minute timed mode or unlimited-time practice. Answers remain hidden until submission in both modes.
- Correct: +1; wrong: −0.5; unanswered: 0. Negative totals are possible. Accuracy counts correct answers as a percentage of attempted questions.
- Previous/next pages, a question navigator, answer changes and answer clearing before submission.
- Submission asks for confirmation and reports unanswered questions. Timed mode submits automatically at the original deadline, including after tab switching or refreshing.
- Answers and results stay in `localStorage` on the same browser/device. Saving can be blocked by browser settings; the page then shows a warning. Nothing is sent to a server. Clearing site storage removes the saved attempt.
- Results show every correct answer, the selected wrong answer where applicable, and a short explanation. Filters show correct, wrong or unanswered questions.
- Starting a new attempt replaces the previous local result. This version has no accounts, shared scores, question randomization or cross-device synchronization.

This is self-practice: browser storage, local clock and client-side answer keys are not suitable for proctored or high-stakes exams.

## Change questions

Edit `questions.js`. Each record contains `topic`, `q`, four options `o`, a zero-based answer index `a`, and a one-line explanation `e`. Keep 30 questions for the current layout and copy. Change `QUESTION_SET` when changing the question set so old saved answers do not carry into a different set. Run `npm test` after editing. Review question wording and facts before sharing publicly.

## Design and privacy

Responsive static HTML, CSS and JavaScript, with native radio controls, keyboard focus styles, submission dialogs and reduced-motion support. No analytics, advertisements, cookies or external runtime requests. Noto Sans Bengali is self-hosted as a compressed font; its SIL Open Font License is in `fonts/OFL.txt`. System fonts provide fallbacks.
