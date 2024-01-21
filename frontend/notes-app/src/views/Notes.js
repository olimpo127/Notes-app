import React, { useEffect, useState } from "react";
import "./Notes.css";
import { useNavigate } from "react-router-dom";

function Notes() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    navigate("/");
  };
  const [user, setUser] = useState({ notes: [] });

  const [loading, setLoading] = useState(true);
  const [updateNoteIds, setUpdateNotesIds] = useState([]);
  const [updateCurrentNote, setUpdateCurrentNote] = useState({
    id: "",
    note: "",
    category: "",
    archived: "",
    user_id: "",
  });
  const [noteDeleted, setNoteDeleted] = useState(false);
  const [noteUpdated, setNoteUpdated] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [archivedNotes, setArchivedNotes] = useState([]);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("http://localhost:5000/profile/", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          },
        });
        if (response.status === 200) {
          const userData = await response.json();

          // Ensure userData.notes is an array
          const userNotes = Array.isArray(userData.notes) ? userData.notes : [];

          // Separate notes into non-archived and archived
          const nonArchivedNotes = userNotes.filter((note) => !note.archived);
          const archivedNotes = userNotes.filter((note) => note.archived);

          setUser((prevUser) => ({
            ...prevUser,
            notes: nonArchivedNotes,
          }));

          setArchivedNotes(archivedNotes);
          // Ensure to set other user properties like username and email
          // assuming they are available in the server response
          setUser((prevUser) => ({
            ...prevUser,
            username: userData.username,
            email: userData.email,
          }));
        } else {
          console.error("Failed to fetch user profile.");
          setUser((prevUser) => ({
            ...prevUser,
            notes: [],
          }));
        }
      } catch (error) {
        console.error("Error fetching user profile: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [noteDeleted, noteUpdated]);

  const handleDelete = async (id, isArchived = false) => {
    try {
      const response = await fetch(`http://localhost:5000/notes/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        console.log(isArchived ? "Archived note deleted" : "Note deleted");
        setNoteDeleted(true);

        // Update the appropriate list based on whether the note is archived or not
        if (isArchived) {
          setArchivedNotes((prevArchivedNotes) =>
            prevArchivedNotes.filter((note) => note.id !== id)
          );
        } else {
          setUser((prevUser) => ({
            ...prevUser,
            notes: prevUser.notes.filter((note) => note.id !== id),
          }));
        }

        setTimeout(() => {
          setNoteDeleted(false);
        }, 3000);
      } else {
        console.error(
          `Error deleting ${isArchived ? "archived " : ""}note: ${
            response.statusText
          }`
        );
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleUpdateNote = (noteId) => {
    const noteToUpdate = allNotes.find((note) => note.id === noteId);

    if (!noteToUpdate) {
      console.error(`Note with id ${noteId} not found.`);
      return;
    }

    setUpdateNotesIds((prevIds) => [...prevIds, noteId]);
    setUpdateCurrentNote({
      id: noteToUpdate.id,
      note: noteToUpdate.note,
      category: noteToUpdate.category,
      archived: noteToUpdate.archived,
      user_id: noteToUpdate.user_id,
    });
  };

  const handleUpdateInputChange = (event) => {
    const { name, value } = event.target;
    setUpdateCurrentNote({ ...updateCurrentNote, [name]: value });
  };

  const handleCreateNote = async () => {
    try {
      const response = await fetch("http://localhost:5000/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
        body: JSON.stringify({
          note: newNote,
          category: newCategory,
          archived: false, // Set the default value for archived or modify as needed
        }),
      });

      if (response.ok) {
        console.log("Note created");
        setNewNote(""); // Clear the input field after successful creation
        setNoteUpdated(true);
        setNewCategory("");
        setTimeout(() => {
          setNoteUpdated(false);
        }, 3000);
      } else {
        console.error(`Error creating note: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `http://localhost:5000/notes/${updateCurrentNote.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateCurrentNote),
        }
      );

      if (response.ok) {
        console.log("Note updated");
        setNoteUpdated(true);

        // Update the appropriate list based on whether the note is archived or not
        if (updateCurrentNote.archived) {
          setArchivedNotes((prevArchivedNotes) =>
            prevArchivedNotes.map((note) =>
              note.id === updateCurrentNote.id
                ? { ...note, note: updateCurrentNote.note }
                : note
            )
          );

          // Remove the note from the list of active notes
          setUser((prevUser) => ({
            ...prevUser,
            notes: prevUser.notes.filter(
              (note) => note.id !== updateCurrentNote.id
            ),
          }));
        } else {
          setUser((prevUser) => ({
            ...prevUser,
            notes: prevUser.notes.map((note) =>
              note.id === updateCurrentNote.id
                ? { ...note, note: updateCurrentNote.note }
                : note
            ),
          }));

          // Remove the note from the list of archived notes
          setArchivedNotes((prevArchivedNotes) =>
            prevArchivedNotes.filter((note) => note.id !== updateCurrentNote.id)
          );
        }

        setUpdateNotesIds((prevIds) =>
          prevIds.filter((noteId) => noteId !== updateCurrentNote.id)
        );
        setTimeout(() => {
          setNoteUpdated(false);
        }, 3000);
      } else {
        console.error(`Error updating note: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleUpdateArchivedNoteClick = (noteId) => {
    setUpdateNotesIds((prevIds) => [...prevIds, noteId]);
    const archivedNoteToUpdate = archivedNotes.find(
      (note) => note.id === noteId
    );
    setUpdateCurrentNote({
      id: archivedNoteToUpdate.id,
      note: archivedNoteToUpdate.note,
      category: archivedNoteToUpdate.category,
      archived: archivedNoteToUpdate.archived,
      user_id: archivedNoteToUpdate.user_id,
    });
  };

  const [categoryFilter, setCategoryFilter] = useState("");
  const allNotes = [...user.notes, ...archivedNotes];

  const filteredActiveNotes = user.notes.filter(
    (note) =>
      !note.archived &&
      note.category.toLowerCase().includes(categoryFilter.toLowerCase())
  );

  const filteredArchivedNotes = archivedNotes.filter(
    (note) =>
      note.archived &&
      note.category.toLowerCase().includes(categoryFilter.toLowerCase())
  );

  return (
    <div className="container">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <div>
            <div className="first">
              <div className="profile">
                <h1>My Notes</h1>
                <p>Username: {user.username}</p>
                <p>Email: {user.email}</p>
                <button
                  onClick={handleLogout}
                  style={{
                    backgroundColor: "red",
                    height: "30px",
                    marginLeft: "70px",
                  }}
                >
                  Logout
                </button>
              </div>

              <div className="note-creation">
                <h2>Create New Note</h2>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your new note"
                />
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Enter category"
                />
                <button
                  onClick={handleCreateNote}
                  style={{ backgroundColor: "blue" }}
                >
                  Create Note
                </button>
              </div>
              <div className="filter">
                <h2>Filter by category</h2>
                <input
                  className="filter"
                  type="text"
                  placeholder="Filter by category..."
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                />
              </div>
            </div>
            <div className="all-notes">
              <div className="active-notes">
                {filteredActiveNotes.length > 0 ? (
                  <ul className="notes">
                    <h2>Active Notes</h2>
                    {filteredActiveNotes.map((note) => (
                      <li key={note.id}>
                        <div className="single-note">
                          <strong className="note-text">Note:</strong>{note.note}
                          <br />
                          <strong>Category:</strong> {note.category}
                          <br />
                          <button
                            onClick={() => handleUpdateNote(note.id)}
                            style={{ backgroundColor: "blue" }}
                          >
                            Update Note
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            style={{ backgroundColor: "red" }}
                          >
                            Delete Note
                          </button>
                        </div>

                        {/* Conditional Form Display */}
                        {updateNoteIds.includes(note.id) && (
                          <div>
                            <form
                            style={{marginBottom: "10px"}}
                              onSubmit={handleUpdate}
                              className="update-form"
                            >
                              <input
                                type="text"
                                name="note"
                                value={updateCurrentNote.note}
                                onChange={handleUpdateInputChange}
                                placeholder="Note"
                              />
                              <input
                                type="text"
                                name="category"
                                value={updateCurrentNote.category}
                                onChange={handleUpdateInputChange}
                                placeholder="Category"
                              />
                              <label style={{marginLeft: "10px"}}>
                                Archive:
                                <input
                                  type="checkbox"
                                  name="archived"
                                  checked={updateCurrentNote.archived}
                                  onChange={(e) =>
                                    setUpdateCurrentNote({
                                      ...updateCurrentNote,
                                      archived: e.target.checked,
                                    })
                                  }
                                />
                              </label>
                              <div className="form-buttons">
                                <button type="submit">Confirm</button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setUpdateNotesIds((prevIds) =>
                                      prevIds.filter(
                                        (noteId) => noteId !== note.id
                                      )
                                    )
                                  }
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No active notes found.</p>
                )}
              </div>
              <div className="archived-notes">
                {/* Display Archived Notes */}
                {showArchived && (
                  <div>
                    {filteredArchivedNotes.length > 0 ? (
                      <ul className="notes">
                        <h2>Archived Notes</h2>
                        {filteredArchivedNotes.map((note) => (
                          <li key={note.id}>
                            <div className="single-note" style={{backgroundColor: "lightyellow"}}>
                              <strong>Note:</strong> {note.note}
                              <br />
                              <strong>Category:</strong> {note.category}
                              <br />
                              <button
                                onClick={() =>
                                  handleUpdateArchivedNoteClick(note.id)
                                }
                                style={{ backgroundColor: "blue" }}
                              >
                                Update Note
                              </button>
                              <button
                                onClick={() => handleDelete(note.id)}
                                style={{ backgroundColor: "red" }}
                              >
                                Delete Note
                              </button>
                            </div>

                            {/* Conditional Form Display */}
                            {updateNoteIds.includes(note.id) && (
                              <div>
                                <form
                                style={{marginBottom: "10px"}}
                                  onSubmit={handleUpdate}
                                  className="update-form"
                                >
                                  <input
                                    type="text"
                                    name="note"
                                    value={updateCurrentNote.note}
                                    onChange={handleUpdateInputChange}
                                    placeholder="Note"
                                  />
                                  <input
                                    type="text"
                                    name="category"
                                    value={updateCurrentNote.category}
                                    onChange={handleUpdateInputChange}
                                    placeholder="Category"
                                  />
                                  <label style={{marginLeft: "10px"}}>
                                    Archive:
                                    <input
                                      type="checkbox"
                                      name="archived"
                                      checked={updateCurrentNote.archived}
                                      onChange={(e) =>
                                        setUpdateCurrentNote({
                                          ...updateCurrentNote,
                                          archived: e.target.checked,
                                        })
                                      }
                                    />
                                  </label>
                                  <div className="form-buttons">
                                    <button type="submit">Update Note</button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setUpdateNotesIds((prevIds) =>
                                          prevIds.filter(
                                            (noteId) => noteId !== note.id
                                          )
                                        )
                                      }
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No archived notes found.</p>
                    )}
                  </div>
                )}

                {/* Toggle Archived Notes Button */}
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  style={{
                    backgroundColor: "green",
                    marginLeft: "150px",
                    marginTop: "20px",
                  }}
                >
                  {showArchived ? "Hide Archived Notes" : "Show Archived Notes"}
                </button>
              </div>
            </div>
          </div>

          {/* Display messages */}
          {noteDeleted && (
            <p className="delete-message">Note deleted successfully!</p>
          )}
          {noteUpdated && (
            <p className="update-message">Note updated successfully!</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Notes;
