# Description

The application itself is to be made for students who are looking to document
their progress over their time on the course, taking notes on which areas in
their SMART goals they improved on a specific entry. A reviewer can look into
which SMART goals are being progressed on throughout the time on the course.

# User Stories

- As a reviewer, I want to be able to view progress on a students meta skills over time.
- As a reviewer, I want to be able view details on a specific diary entry.
- As a student, I want to be able to dynamically edit a diary entry.
- As a student, I want to be able to enter my progress on my metaskills.
- As a student, I want to be able to reference my SMART goals on a specific diary entry.

# Requirements

| ID   | Title                | Description                                                 | Dependencies |
| ---- | -------------------- | ----------------------------------------------------------- | ------------ |
| FR01 | Add entry            | Add a single diary entry to the list of entries             |              |
| FR02 | Delete entry         | Delete a diary entry from the list of entries               |              |
| FR03 | View an entry        | View a diary entry's specific details                       | FR01         |
| FR04 | Sort entries         | Sort all the different diaries based on different criteria  |              |
| FR05 | Edit an entry        | Edit a specific diary entry                                 | FR01, FR03   |
| FR06 | Save entries         | Save the entire list of diary entries                       | FR01         |
| FR07 | Graph of progress    | Create a graph of meta skills progress over time            | FR03, FR05   |
| FR08 | Import markdown file | Import a markdown file from disk and produce a diary entry  | FR01         |
| FR09 | Reference SMART goal | A diary entry showing which goal was improved on in a diary | FR05         |
| FR10 | Load entries         | Load all the diary entries from disk                        | FR06         |

| ID    | Title         | Description                                                 |
| ----- | ------------- | ----------------------------------------------------------- |
| NFR01 | Efficiency    | The application can display diary entries efficiently       |
| NFR02 | Budget        | The application to conform to budget constraints            |
| NFR03 | Timeslot      | The application to be done within the allocated time period |
| NFR04 | Accessibility | The application to be accessible to different kinds of user |
| NFR05 | Robustness    | The application able to handle erroneous inputs             |

# Wireframes

![Use Case](target/use-case-diagram.svg "Use Case")

![State](target/state.svg "State")

![Diary View](design/wireframe-1.svg "Diary View")

![Entry View](design/wireframe-2.svg "Entry View")

# MoSCoW

| Priority | Requirement                    |
| -------- | ------------------------------ |
| Must     | FR01, FR02, FR03, FR05         |
| Should   | FR04, FR06, FR09, NFR01, NFR03 |
| Could    | FR08, NFR02, NFR04, NFR05      |
| Won't    | FR07                           |

# Testing

| ID | Logic                                | Type   | Parameters | Expected Result |
| -- | ------------------------------------ | ------ | ---------- | --------------- |
| 1  | Save file to entries                 | Normal |            |                 |
| 1  | Successfully translate markdown file | Normal |            |                 |

# Feedback

## Design
## Programming
## End User
## UI

# Documentation

## Deployment

- htm: https://unpkg.com/htm/preact/standalone.module.js
- Tailwind: https://unpkg.com/@tailwindcss/browser@4.0.9/dist/index.global.js

## Evaluation

# Meetings

| Chair/Designer | Attendees | Topic                                                                     |
| -------------- | --------- | ------------------------------------------------------------------------- |
| Ethan Reynard | Alan Hart  | Review User Interface (UI) design documentation and requirements document |
 
## Actions
- Non func reqs, can you make them all specific. ie 'not within budget' but 'within budget amount of £0'
- Wireframes. How do you add new goals? 
- Need extra commentary on how to select a task and move to the next screen, and move back.
- Decide on name of second screen so that it can be consistently referred to in the documentation.
- user diagram missing extend and include commentary
- Needs state diagram added before final submission