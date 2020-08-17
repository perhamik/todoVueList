# Todo list with History (Vue.js)

Online single user Todo list, mobile-ready, VueJS powered.
  - Create Notes (contains: title and sequence of tasks)
  - Create Task
  - Change history
  - Local Data saving

# Functionality
> Main page
- Create new Note
- Go to edit selected Note
- Remove selected Note (with modal confirmation)

> Edit Note
- Save changes (or Ctrl + S)
- Discard changes (with modal confirmation (Ctrl + Q))
- Remove Note (with confirmation)
- Undo (use Ctrl + Z)
- Redo (use Ctrl + Y)

# Additionally
> Storage
- Dynamic saving to browser local storage as JSON string
- To reduce storage size, change history isn't saving
- Unlimited count of Notes and Tasks (may drain more memory and won't correctly work at slow devices)

# Screenshots
> Main Page

![Alt text](/src/main-page.jpg?raw=true "Main Page")

> Edit Page

![Alt text](/src/edit-page.jpg?raw=true "Edit Page")

> Confirm Discard Changes

![Alt text](/src/modal-changes.jpg?raw=true "Discard Changes Confirm (modal)")

> Confirm Delete Note

![Alt text](/src/modal-delete.jpg?raw=true "Delete Note Confirm (modal)")

> Confirm Delete Note (Edit Page)

![Alt text](/src/modal-delete-inside.jpg?raw=true "Delete Note Confirm (modal)")

# Refference
Link: http://perhamik.pw/