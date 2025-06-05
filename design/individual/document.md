# Table of Contents

- Description (#description)
- User Stories (#user-stories)
-- Types of Users (#users)
-- Examples (#examples)
- Requirements (#requirements)
- Diagrams (#diagrams)
- MoSCoW (#moscow)
- Testing (#testing)
-- Automated (#automated)
-- Manual (#manual)
- Feedback (#feedback)
-- Likert Scale Questionnaires (#likert-scale-questionnaires)
-- Reflection 1 (#reflection-1)
-- Reflection 2 (#reflection-2)
-- Reflection 3 (#reflection-3)
-- Reflection 4 (#reflection-4)
- Documentation (#documentation)
-- Deployment (#deployment)
--- Windows (#Windows)
--- Linux (#linux)
-- Compiling (#compiling)
-- Sources (#sources)
--- Mandatory (#mandatory)
--- Optional (#optional)
--- External (#external)
-- Evaluation (#evaluation)
- Meetings (#meetings)
-- 18/03/2025 (#18/03/2025)

# Description

The application itself is to be made for students who are looking to document
their progress over their time on a college course, taking notes on which of
their SMART goals they improved upon, documenting it within an entry which the
student can edit with real-time feedback on how its displayed. A reviewer can
look into which SMART goals are being progressed on throughout the time on the
course. The application is called MetaKey, named after the meta key on old
keyboards, with the logo being with a diamond to symbolize it.

# User Stories

## Types of Users

- Student, the primary user of the program, someone who wants to stack their progress of their meta skills goals.
- Reviewer, a reviewer of a single students meta skills.

## Examples

- As a reviewer, I want to be able to view progress on a students meta skills over time.
- As a reviewer, I want to be able view details on a specific diary entry.
- As a student, I want to be able to dynamically edit a diary entry.
- As a student, I want to be able to enter my progress on my meta skills.
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

| ID    | Title         | Description                                                                           |
| ----- | ------------- | ------------------------------------------------------------------------------------- |
| NFR01 | Efficiency    | The application can display diary entries efficiently                                 |
| NFR02 | Budget        | The application to conform to budget constraints, within $0                           |
| NFR03 | Timeslot      | The application to be done within the allocated time period, 26/02/2025 to 02/04/2025 |
| NFR04 | Accessibility | The application to be accessible to different kinds of user                           |
| NFR05 | Robustness    | The application able to handle erroneous inputs                                       |

# Diagrams

![Use Case](target/use-case.svg)

Use case diagram for the function and non-function requirements.

![State](target/state.svg)

State diagram for FR08.

![Logo](frontend/logo.svg)

Logo for the application, converted to different formats based on target
platform.

![Diary View](design/diagrams/diary-view.svg)

Diary View for the application, launched on startup.

![Entry View](design/diagrams/entry-view.svg)

Entry View for the application, launched when viewing an entry.

# MoSCoW

| Priority | Requirement                    |
| -------- | ------------------------------ |
| Must     | FR01, FR02, FR03, FR05         |
| Should   | FR04, FR06, FR09, NFR01, NFR03 |
| Could    | FR08, NFR02, NFR04, NFR05      |
| Won't    | FR07                           |

# Testing

## Automated

| ID | Logic               | Type   |
| -- | ------------------- | ------ |
| A1 | Save entry to diary | Normal |
| A2 | Save goal to diary  | Normal |
| A3 | Import markdown     | Normal |

![Results](design/evidence/automated.png)

## Manual

| ID  | Logic                 | Type   | Before                              | After                              |
| --- | --------------------- | ------ | ----------------------------------- | ---------------------------------- |
| M01 | Import markdown file  | Normal | ![](design/evidence/M01-Before.png) | ![](design/evidence/M01-After.png) |
| M02 | Add goal to diary     | Normal | ![](design/evidence/M02-Before.png) | ![](design/evidence/M02-After.png) |
| M03 | Add entry to diary    | Normal | ![](design/evidence/M03-Before.png) | ![](design/evidence/M03-After.png) |
| M04 | Remove entry          | Normal | ![](design/evidence/M04-Before.png) | ![](design/evidence/M04-After.png) |
| M05 | Insert text           | Normal | ![](design/evidence/M05-Before.png) | ![](design/evidence/M05-After.png) |
| M06 | Insert image          | Normal | ![](design/evidence/M06-Before.png) | ![](design/evidence/M06-After.png) |
| M07 | Insert heading        | Normal | ![](design/evidence/M07-Before.png) | ![](design/evidence/M07-After.png) |
| M08 | Change name of entry  | Normal | ![](design/evidence/M08-Before.png) | ![](design/evidence/M08-After.png) |
| M09 | Change date of entry  | Normal | ![](design/evidence/M09-Before.png) | ![](design/evidence/M09-After.png) |
| M10 | Go to view entry      | Normal | ![](design/evidence/M10-Before.png) | ![](design/evidence/M10-After.png) |
| M11 | Search entries        | Normal | ![](design/evidence/M11-Before.png) | ![](design/evidence/M11-After.png) |
| M12 | Back to diary view    | Normal | ![](design/evidence/M12-Before.png) | ![](design/evidence/M12-After.png) |

# Feedback

## Likert Scale Questionnaires

1. [Georgi Mirchev](design/evidence/georgi-mirchev.docx)

## Reflection 1

Description: Did the design meet the client requirements?

The design closely followed the clients requirements when thinking about the UX
of the program, including messages to help the user whenever possible.

## Reflection 2

Description: The initial design was peer reviewed, and feedback provided. Did this change your design or the way that you implemented the design? What did change?

The application UI's layout and the colour palette was changed to make the
application more comprehensible to the average user. This involved making new
colour schemes with [Coolors](https://coolors.co) and seeing how they would
display given example UI elements.

## Reflection 3

Description: Did the UX testing highlight any possible improvements that could be made. Did the user testing uncover any bugs not detected in your functional testing?

Some manual tests highlighted problems in the coherence of the application.
Some bugs were found in development of the application using testing, the
relevant tests were then updated to reflect the changes in the application.

## Reflection 4

Description: Anything that you would like to do differently or something that you thought worked well and you would do again?

- The application relying on Tauri for its development went well as it
    integrated with the OS' existing tooling.
- Cargo made installing and testing different libraries easy across different platforms, making iterations quicker.
- A bigger unification of tooling across both the back-end and front-end, ideally the GUI would make use of an rust library to make it more scalable and stable.

# Documentation

## Deployment

### Windows

The application can be installed by downloading the .msi file and double
clicking it, the installer will run you through the installation process.

### Linux

The application doesn't need further configuration and can be run just by
executing the "metakey" file, using either a graphical file manager or from the
terminal.

## Compiling

The application primarily requires the installation of
[Tauri](https://v2.tauri.app), check the relevant installation guide found on
their website. The application can be compiled by running the following command within the
root of the repository.

```sh
cargo tauri dev
```

The build.rs contains code to automatically convert the logo to the relevant
platforms' format, if the build fails use the following command to build for
your relevant platform if ImageMagick is installed in your "PATH" environment
variable.

```sh
convert -density 300 icon:auto-resize=256,128,96,64,48,32,16 -background none frontend/logo.svg target/icon.ico
```

Otherwise manual conversions are required via use of an external tool of your
choice, placing the converted file into target/icon.ico (create the target
directory if it doesn't already exist).

## Sources

### Mandatory

| Purpose              | Name        | Link                                                                                       |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------ |
| Programming Language | Rustup      | https://www.rust-lang.org/learn/get-started                                                |
| UI Logic             | Preact, htm | https://preactjs.com, https://unpkg.com/htm/preact/standalone.module.js                    |
| UI Styling           | Tailwind    | https://tailwindcss.com, https://unpkg.com/@tailwindcss/browser@4.0.9/dist/index.global.js |
| Cross Platform GUI   | Tauri       | https://v2.tauri.app                                                                       |

### Optional

| Purpose            | Name        | Link                    |
| ------------------ | ----------- | ----------------------- |
| Logo Conversions   | ImageMagick | https://imagemagick.org |

### External

| Purpose        | Name    | Link               |
| -------------- | ------- | ------------------ |
| Colour Palette | Coolors | https://coolors.co |
| Wireframes     | Draw.io | https://draw.io    |

## Evaluation

# Meetings

## 18/03/2025

- Chair/Designer: Ethan Reynard
- Attendees: Alan Hart
- Topic: Review User Interface (UI) design documentation and requirements document

- Non func reqs, can you make them all specific. ie 'not within budget' but 'within budget amount of £0'
- Wireframes. How do you add new goals? 
- Need extra commentary on how to select a task and move to the next screen, and move back.
- Decide on name of second screen so that it can be consistently referred to in the documentation.
- user diagram missing extend and include commentary
- Needs state diagram added before final submission
