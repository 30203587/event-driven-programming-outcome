# User Stories

As a reviewer, I want to be able to view progress on a students meta skills over time.
As a reviewer, I want to be able view details on a specific diary entry.
As a student, I want to be able to dynamically edit a diary entry.
As a student, I want to be able to enter my progress on my metaskills.
As a student, I want to be able to reference my SMART goal on a specific diary entry.

# Requirements

| ID   | Title                                   | Description                                                 | Dependencies |
| ---- | --------------------------------------- | ----------------------------------------------------------- | ------------ |
| FR01 | Add diary entry                         | Add a single diary entry to the list of entries             |              |
| FR02 | Delete diary entry                      | Delete a diary entry from the list of entries               |              |
| FR03 | View a diary entry                      | View a diary entry's specific details                       | FR01         |
| FR04 | Sort diary entries                      | Sort all the different diaries based on different criteria  |              |
| FR05 | Edit a diary entry                      | Edit a specific diary entry                                 | FR01, FR03   |
| FR06 | Save the list of diary entries          | Save the entire list of diary entries                       | FR01         |
| FR07 | Produce a graph of meta skills progress | Create a graph of meta skills progress over time            | FR03, FR05   |
| FR08 | Import a markdown file                  | Import a markdown file from disk and produce a diary entry  | FR01         |
| FR09 | Reference a SMART goal                  | A diary entry showing which goal was improved on in a diary | FR05         |
| FR10 | Load list of entries                    | Load all the diary entries from disk                        | FR06         |

| ID    | Title         | Description                                                 |
| ----- | ------------- | ----------------------------------------------------------- |
| NFR01 | Efficiency    | The application can display diary entries efficiently       |
| NFR02 | Budget        | The application to conform to budget constraints            |
| NFR03 | Timeslot      | The application to be done within the allocated time period |
| NFR04 | Accessibility | The application to be accessible to different kinds of user |
| NFR05 | Robustness    | The application able to handle erroneous inputs             |

# Wireframes

![List of entries](design/wireframe-1.svg)
![Specific entry](design/wireframe-2.svg)

# MoSCoW

| Priority | Requirement                          |
| -------- | ------------------------------------ |
| Must     | FR01, FR02, FR03, FR05               |
| Should   | FR04, FR06, FR07, FR09, NFR01, NFR03 |
| Could    | FR08, NFR02, NFR04, NFR05            |
| Won't    |                                      |

# Testing

| ID | Logic | Type   | Parameters | Expected Result |
| -- | ----- | ------ | ---------- | --------------- |
| 1  |       | Normal |            |                 |

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
