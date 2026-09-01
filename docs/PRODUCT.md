# Product Specification

## 1. Product Overview

A local-first learning and execution system designed to help a person turn long-term learning goals into concrete work, execute that work consistently, review what they have learned, and understand their actual progress.

It is not intended to be a generic todo list.

The product is built around a simple idea:

> **Learning should move from intention → planning → execution → review → measurement.**

Most productivity tools handle tasks.

Most learning platforms handle content.

This product sits between the two.

It manages the **work required to become better at something**.

---

# 2. The Problem

Learning independently creates a problem that ordinary task managers do not solve well.

A learner may have:

* courses to complete
* books to read
* problems to solve
* projects to build
* concepts to revisit
* deadlines to meet
* skills to practice
* ideas they want to explore

The amount of information quickly becomes larger than what can be kept in working memory.

This creates several recurring failures:

### 2.1 Lack of clarity

The learner knows they want to improve but does not know what they should work on today.

### 2.2 Planning without execution

A large plan can look impressive while producing very little actual work.

### 2.3 Fragmented learning

Resources, notes, tasks, deadlines, and progress live in different places.

### 2.4 Forgetting

Finishing something does not necessarily mean learning it.

A learner may solve a problem with assistance, watch a lecture, or read an explanation and later discover that they cannot reproduce the knowledge independently.

### 2.5 Loss of continuity

When a learner becomes distracted or stops for several days, it becomes difficult to understand where they were, what mattered, and what should happen next.

### 2.6 Overhead

Planning itself can become another form of procrastination.

The product therefore needs to help users **decide less and execute more**.

---

# 3. Product Vision

The long-term vision is to create a personal **Learning Operating System**.

The system should maintain the learner's entire learning journey:

```text
Goals
  ↓
Topics
  ↓
Plans
  ↓
Tasks
  ↓
Execution
  ↓
Review
  ↓
Evidence of understanding
  ↓
Progress
  ↓
Better future planning
```

The product should gradually build a model of:

* what the learner wants to achieve
* what they are currently working on
* what they have completed
* what they repeatedly postpone
* what they struggled with
* what needs review
* how long work actually takes
* where their weaknesses are

The ultimate goal is not to maximize the number of completed tasks.

It is to maximize **meaningful learning progress**.

---

# 4. Product Principles

## 4.1 Execution over planning

Planning exists to make execution easier.

The product should never require excessive configuration before useful work can begin.

---

## 4.2 One place for the learning journey

A learner should not need separate systems for:

* study planning
* task management
* progress tracking
* review
* competitive programming practice
* reminders

The system should connect these activities.

---

## 4.3 Completion is not understanding

A completed task is evidence that an action happened.

It is not automatically evidence that learning happened.

The product should distinguish between:

```text
Completed
        ≠
Understood
        ≠
Can reproduce independently
```

This distinction becomes especially important for technical learning and problem solving.

---

## 4.4 Local-first

The core product should work locally without requiring a permanent cloud service.

Benefits:

* user owns their data
* fast interaction
* works offline
* low operating cost
* simple deployment
* easy backup
* fewer external dependencies

Cloud functionality can be added later without making it a requirement for the core experience.

---

## 4.5 Data portability

The user's learning history belongs to the user.

The system should make it easy to:

* export data
* import data
* back up data
* migrate installations

The product should avoid locking the learner into a proprietary data format.

---

## 4.6 Minimal friction

Every additional click creates resistance.

Common actions should therefore be fast:

* create task
* complete task
* create subtask
* change priority
* change due date
* start a session
* record progress
* review previous work

---

## 4.7 Honest progress

Progress indicators should represent useful information.

The product should avoid creating meaningless metrics simply because they look motivating.

A learner completing 100 tiny tasks should not necessarily appear more successful than someone mastering a difficult subject.

---

# 5. Target User

The primary user is an independent learner who is managing a large technical or academic learning workload.

Typical examples include:

* university students
* competitive programmers
* software developers
* people learning technical subjects independently
* students preparing for difficult examinations
* developers working through large skill roadmaps

The ideal user is comfortable with structured work but struggles with maintaining continuity across a large number of learning goals.

---

# 6. Core User Workflow

The primary workflow is:

```text
Capture
  ↓
Organize
  ↓
Plan
  ↓
Execute
  ↓
Record
  ↓
Review
  ↓
Adjust
```

### Capture

The user records something they want or need to learn.

Examples:

* "Learn Dijkstra"
* "Finish Operating Systems chapter 4"
* "Solve 30 graph problems"
* "Build REST API"
* "Review binary search"

### Organize

The item belongs to a broader topic or category.

Example:

```text
Competitive Programming
├── Graphs
│   ├── BFS
│   ├── DFS
│   ├── Dijkstra
│   └── MST
├── Dynamic Programming
└── Number Theory
```

### Plan

The learner converts intentions into executable work.

### Execute

The learner focuses on the current work rather than managing the entire system.

### Record

The system records useful evidence:

* completion
* duration
* difficulty
* review status
* notes
* external resources
* assistance received

### Review

The system brings previous work back when it should be revisited.

### Adjust

Future planning should reflect what actually happened.

---

# 7. Core Product Model

The product revolves around a small number of concepts.

## 7.1 Categories

Large learning areas.

Examples:

* University
* Backend
* Competitive Programming
* Systems
* Mathematics

Categories provide structure without forcing the user into a rigid curriculum.

---

## 7.2 Tasks

Concrete pieces of work.

Examples:

* Read chapter 3
* Implement a REST endpoint
* Solve problem X
* Watch lecture 5
* Write notes about Dijkstra

Tasks should be actionable.

Bad:

> Learn graphs.

Better:

> Solve five BFS problems.

---

## 7.3 Subtasks

Complex work can be decomposed into smaller pieces.

Example:

```text
Build REST API
├── Design database schema
├── Implement authentication
├── Implement users endpoint
├── Add validation
└── Write integration tests
```

Nested work should remain visible without overwhelming the main view.

---

## 7.4 Due Dates

Tasks can have deadlines.

Due dates exist to answer:

> When should this happen?

They should not turn every task into an emergency.

---

## 7.5 Priority

Priority answers:

> What matters more right now?

Priority should influence visibility and planning rather than simply changing a task's appearance.

---

## 7.6 Resources

Tasks may reference external material:

* articles
* documentation
* videos
* repositories
* problem statements
* lectures

The resource supports the work.

It should not replace the work.

---

## 7.7 Notes

Notes provide context needed to continue work later.

They should be lightweight rather than becoming a full knowledge-management system.

---

# 8. Main Experience

## 8.1 Focused Board

The main screen should answer three questions immediately:

1. **What am I working on?**
2. **What should I do next?**
3. **What is becoming overdue or neglected?**

The interface should avoid turning the user's entire learning system into visual noise.

---

## 8.2 Near-Due Work

The product should surface work that requires attention soon.

This provides a middle ground between:

* seeing everything
* seeing only today's tasks

The user should be able to understand upcoming pressure without opening a separate planning system.

---

## 8.3 Calendar

The calendar provides a time-based view of planned work.

Its purpose is not to become a traditional calendar application.

It should help answer:

> What does my learning workload look like over time?

---

## 8.4 Progress

Progress should provide evidence rather than decoration.

Useful measurements may include:

* completed tasks
* completion over time
* category progress
* overdue work
* study duration
* review completion
* problem-solving performance

Metrics should remain subordinate to the actual learning objective.

---

# 9. Reminders and Notifications

The system should remind the learner about work without becoming noisy.

Supported concepts include:

* overdue notifications
* scheduled reminders
* recurring reminders
* interval-based reminders

Notifications should be actionable.

A notification should answer:

> What needs my attention?

rather than simply:

> Something happened.

---

# 10. Competitive Programming Lab

The Competitive Programming Lab is a specialized extension of the core learning model.

Competitive programming exposes an important weakness of ordinary task managers:

> Solving a problem once does not prove that the underlying idea was learned.

The CP Lab should therefore track **learning evidence**, not only completion.

---

## 10.1 Problem History

The system can retrieve a user's competitive programming history from an external platform such as Codeforces.

The purpose is not merely to display statistics.

The history becomes input for future training.

---

## 10.2 Assisted Solves

The system should distinguish between:

* solved independently
* solved with a hint
* solved with significant assistance
* read the solution
* implemented after seeing the solution

These states should not be treated as equivalent.

---

## 10.3 Re-testing

Problems that were solved with assistance can return later.

The learner should attempt the problem again without seeing the original solution.

Possible states:

```text
Saw solution
      ↓
Review later
      ↓
Attempt independently
      ↓
Successful reproduction
```

This turns previous mistakes into future training opportunities.

---

## 10.4 Stopwatch

Problem-solving sessions should support timing.

The user should be able to record:

* start time
* end time
* total duration

This makes problem difficulty and personal performance measurable.

---

## 10.5 Review Sessions

The CP Lab should eventually integrate with the main planning system.

For example:

```text
Competitive Programming
└── Graphs
    ├── New Problems
    ├── Weak Problems
    └── Review Problems
```

Review work should become normal planned work rather than something the learner must remember manually.

---

# 11. Learning State

The product should eventually model learning at a deeper level than task completion.

A useful conceptual state might be:

```text
Not Started
    ↓
Studying
    ↓
Practiced
    ↓
Completed
    ↓
Needs Review
    ↓
Recalled Independently
```

The exact implementation may change.

The important principle is that **learning is a process, not a checkbox**.

---

# 12. Planning Philosophy

The product should support both:

### Top-down planning

```text
Goal
→ Category
→ Topic
→ Tasks
```

and:

### Bottom-up planning

```text
Something I need to do
→ Create task
→ Assign category
→ Schedule it
```

Users should not be forced to design an elaborate curriculum before using the system.

---

# 13. Anti-Overengineering Rules

The product should actively resist becoming bloated.

Avoid turning it into:

* a social network
* a generic project-management platform
* a full calendar replacement
* a note-taking platform
* a document editor
* a habit-tracking platform
* an AI chatbot with a task list attached

Features should exist because they improve learning execution.

Not because another productivity application has them.

---

# 14. AI Direction

AI can eventually assist the learning system, but it should not replace the learner's thinking.

Potential uses include:

* converting vague goals into executable tasks
* detecting overloaded schedules
* identifying neglected topics
* suggesting review sessions
* identifying recurring weaknesses
* summarizing progress
* recommending what to work on next

For competitive programming, AI should be especially careful.

The product should not make it easier to falsely believe that a problem was learned.

AI assistance should ideally become **learning metadata**.

For example:

```text
Problem:
X

Result:
Solved

Assistance:
Used external explanation

Confidence:
Low

Future action:
Re-test in 7 days
```

This is more valuable than simply recording:

```text
Solved ✓
```

---

# 15. Data Ownership

The system should treat learning history as first-class user data.

The user should be able to export their information into a human-readable and machine-readable format.

The product should avoid unnecessary dependence on proprietary infrastructure.

A future cloud version should preserve the same principle.

---

# 16. MVP

The minimum useful product consists of:

### Planning

* categories
* tasks
* nested subtasks
* priorities
* due dates

### Execution

* focused task board
* completion tracking
* task ordering

### Visibility

* near-due work
* calendar
* basic progress

### Reliability

* local persistence
* reminders
* JSON export/import

The MVP should remain fast and understandable.

---

# 17. Post-MVP

After the core system is stable, the highest-value additions are:

1. Competitive Programming Lab
2. Review/retesting workflow
3. Study-session timing
4. Better learning-state tracking
5. Historical analytics
6. Smarter planning assistance
7. Optional synchronization
8. Cross-device support

These should be developed based on actual usage rather than speculation.

---

# 18. Non-Goals

The product is explicitly **not** trying to become:

### Another Todo App

Tasks exist to support learning.

### Another LMS

The product does not need to host courses or educational content.

### Another Notion

The product should not require users to construct their own productivity system from unlimited blocks and databases.

### Another Social Platform

Learning performance does not need public feeds, likes, or followers.

### A Gamification Engine

Points and streaks should not become the primary motivation.

### An AI Teacher

AI may assist planning and review, but the product should preserve deliberate practice and independent thinking.

---

# 19. Success Metrics

The product should measure whether it improves actual behavior.

Potential metrics:

### Execution

* tasks completed
* planned vs completed work
* overdue rate
* average task completion time

### Consistency

* active study days
* completed sessions per week
* abandoned tasks

### Learning

* review completion
* successful independent retests
* repeated mistakes
* improvement over time

### Competitive Programming

* problems attempted
* independent solves
* assisted solves
* re-test success
* average solve time
* performance by topic

The most important metric is:

> **Does the system help the user consistently do meaningful work and retain what they learned?**

---

# 20. Product Evolution

The product should evolve through actual use.

The development loop is:

```text
Use
 ↓
Notice friction
 ↓
Identify the real problem
 ↓
Build the smallest useful improvement
 ↓
Use again
 ↓
Measure
 ↓
Repeat
```

This is preferable to designing a massive productivity platform upfront.

---

# 21. Long-Term Vision

The mature product should feel less like a task manager and more like a personal learning control system.

It should understand:

```text
Where am I?
What am I trying to achieve?
What should I do now?
What have I actually done?
What did I struggle with?
What have I forgotten?
What should I review?
Am I making progress?
What should change next?
```

The system should gradually transform a large collection of ambitions into an executable learning process.

The final product is not the database.

It is not the board.

It is not the calendar.

It is not the task list.

Those are interfaces around the real product:

> **A system that helps a person reliably turn learning intentions into demonstrated ability.**
