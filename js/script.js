Vue.use(Vuex);

var checkType = function (name){      //check type of mutation to save in history
  return name != 'initStore' && name != 'editNote' && name != 'cdeleteNote' && name != 'cancelDelete' && name != 'setDiscardFlag' && name != 'deleteNote' && name != 'deleteTodo' ? true : false;    //name of mutation
};

const actionPlug = store => {
  undoRedoHistory.init(store);  //init object storage
  let firstState = deepClone(undoRedoHistory.replaceFromLocal(store.state));  //clone data from Local Storage
  undoRedoHistory.addState(firstState);   //push zero-state
  undoRedoHistory.addState(firstState);   //push first-state to resfresh data
  undoRedoHistory.undo();
  if(undoRedoHistory.checkBefItem()){     //check Local Storage to contains saved copy of current editing Note
    undoRedoHistory.beforeEdit = deepClone(undoRedoHistory.getLocalBefItem());    
  }
  
  store.subscribe((mutation, state) => {        // is called AFTER every mutation    
    if(mutation.type == 'editNote'){           //if mutation called 'editNote' (Edit button clicked)
      undoRedoHistory.saveBeforeEdit(deepClone(state));    //save current item for discard all changes    
    }else if(mutation.type == 'cdeleteNote'){           //if mutation called 'cdeleteNote' (Delete confirm)
      let delNoteIndex = store.getters.findNoteIndex(state.deleteId);     //get index in array
      state.deleteId = -1;    //flush delete index      
      undoRedoHistory.addState(deepClone(state));   //add current state to history array
      undoRedoHistory.saveLocal(state);      //save this state to Local Storage      
    }else if(checkType(mutation.type)){        //save only selected events
      undoRedoHistory.addState(deepClone(state));   //add current state to history array
      undoRedoHistory.saveLocal(state);      //save this state to Local Storage
    }
  });
  
};

class UndoRedoHistory {
  store;          //class storage
  history = [];    // HISTORY array
  currentIndex = -1;    // HISTORY array length
  beforeEdit;     //clone copy of EDIT NOTE (discard all changes)

  init(store) {    
    this.store = store;     // STATE reference to app storage
  }
  clear(){
    this.store.replaceState({});    //flush data
  }
  addState(state) {   
    if (this.currentIndex + 1 < this.history.length) {
      this.history.splice(this.currentIndex + 1);   // for REDO
    }
    this.history.push(state);     //save step
    this.currentIndex++;    //move index array
  }
  saveBeforeEdit(state) {    
    localStorage.setItem('beforeEdit', JSON.stringify(this.beforeEdit = state));  //save EDIT NOTE to Local Storage
    state.editId = -1;
    state.discardFlag = 0;
  }
  saveLocal(state){ 
    if(this.currentIndex < 0) return;   //check if defined
    localStorage.setItem('stateStore', JSON.stringify(JSON.stringify(state)));    //place STATE to Local Storage
  }
  replaceFromLocal(state){
    if(this.checkLocal()) return state = JSON.parse(this.getLocal());   //if Local contains STATE -> return it
    else return state;    //else, return itself
  }
  checkLocal(){
    return localStorage.getItem('stateStore') > '';   //check STATE in Local Storage
  }
  getLocal(){   
    return JSON.parse(localStorage.getItem('stateStore'));  //get parsed STATE value from Local Storage
  }
  getLocalBefItem(){
    return JSON.parse(localStorage.getItem('beforeEdit'));    //get parsed EDIT NOTE value from Local Storage
  }
  checkBefItem(){
    return localStorage.getItem('beforeEdit') > '';   //check EDIT NOTE in Local Storage
  }
  discardChanges (){        
    let prev = this.beforeEdit;   //reference to SAVED EDIT NOTE
    if(prev){     
      prev.editState = false;   //switch off EDITING MODE
      prev.editId = -1;
      prev.discardFlag = 0;
      this.store.replaceState(deepClone(prev));   //replace current EDIT NOTE with saved copy
    }    
  }
  undo() {    
    if(this.currentIndex > 0){    //history contains steps
      const prevState = this.history[this.currentIndex - 1];    //get previous step
      this.store.replaceState(deepClone(prevState));    //replace with deep clone this step
      this.currentIndex--;    //move array index
    }    
  }
  redo() {    
    if(this.currentIndex > -1 && this.currentIndex < (this.history.length - 1)){    //check index save position
      const nextState = this.history[this.currentIndex + 1];    //get undo step
      this.store.replaceState(deepClone(nextState));    
      this.currentIndex++;
    }
  }
}

const undoRedoHistory = new UndoRedoHistory();    //create class object

let store = new Vuex.Store({    
  state: {    
  	editState: false,    // EDITING MODE 
    editId: -1,    //current EDIT NOTE
    deleteId: -1,  //item to DELETE
  	discardFlag: 0,    // CONFIRM DISCARD CHANGES WINDOW
    notes: [],   // NOTES array
    newTask: {}    
  },
  getters: {
    nextId: state => {      
      return state.notes.length > 0 ? state.notes.slice(-1)[0].id+1 : 0;  // return id for NEXT NOTE in array
    },
    nextTodoId: state => {
      return state.notes[state.editId].tasks.length;
    },
    newNote: state => {     
      return {        
        id: store.getters.nextId,   //set new id
        title: 'New Note ' + (store.getters.nextId + 1),    //set title | Mask: New Note {id++}
        tasks: [
          {id:0, done: false, text: 'Task 1'}
        ],
        confirmDelete: false    //  CONFIRM DELETE NOTE WINDOW
      };      
    },
    newTodo: state => {
      let tasks = store.getters.getEditNote.tasks;      
      let task = {
          id: tasks.length,
          done: false,
          text: 'Temp'
        }; 
      return task; 
      
    },
    newTodoObj: state => {
      return store.state.newTask ? store.state.newTask : store.state.newTask = store.getters.newTodo;   //check and return new task or link rel
    },
    findNote: state => key => {
      return state.notes.find(x => x.id == key);    //return NOTE in array (searching by Object ID)
    },
    findNoteIndex: state => key => {
      return state.notes.findIndex(x => x.id == key);   //return NOTE position in array (searching by Object ID)
    },
    getDelNote: state => {
      return state.notes.find(x => x.id == state.deleteId);   //return NOTE (to delete) in array (searching by Object ID)
    },
    getNotes: state => {
      return state.notes;     //return reference to NOTES 
    },
    getEditNote: state => {
      return state.notes[state.editId];   //return reference to EDIT NOTE 
    },
    getEditState: state => {
      return state.editState;     //return EDIT mode
    },
    getEditId: state => {
      return state.editId;     //return EDIT NOTE ID
    },
    getDiscardFlag: state => {
      return state.discardFlag;   //return FLAG DISCARD CHANGES
    },
    getChanges: state => {
      return state.discardFlag == 1;  //return TRUE if CHANGES was made
    }
  },
  mutations: {
  	initStore: (state, payload) => { 
      state = payload;
    },
    onChange: (state, payload) => {      
      state.discardFlag = 1;      //if detect any changes in editing mode
    },
    addNote: (state, payload) => {
      state.notes.push(payload);       //push new NOTE in array
    },
    addTodo: (state, payload) => {
      state.notes[state.editId].tasks.push(payload);    //push new TASK in current NOTE
      state.newTask = {};     //flush variable
    },   
    editNote: (state, payload) => {
      let idInArr = store.getters.findNoteIndex(payload);   //get NOTE index in array
      state.editId = idInArr;      //save id
      state.editState = true;     //change edit state
      if(!state.newTask) state.newTask = store.getters.newTodoObj;  //generate new task
      for(let x=0, y=store.getters.getNotes.length; x<y; x++){
        state.notes[x].confirmDelete = false;     //save check unconfirmed flag
      }
      state.deleteId = -1;    //flush delete index
    },
    backAction: (state, payload) => {      //exit from EDIT MODE
      if(store.getters.getChanges){   //check changes
        state.discardFlag = 2;    //if exist, output modal dialog
      } 
      else{
        state.editState = false;    //else, switch off EDIT MODE
        state.editId = -1;      //flush edit index
        state.discardFlag = 0;    //flush change flag
      } 
    },
    discardAction: (state, payload) => {    //discard changes button click
      state.editState = false;    //change EDIT MODE
      state.editId = -1;       //flush edit index
      undoRedoHistory.discardChanges();   //return to prev version of NOTE (before editing)
      state.discardFlag = 0;    //flush change flag
    },
    saveCommit: (state, payload) => {
      state.editState = false;  //change EDIT MODE
      state.editId = -1;  //flush edit index
      state.deleteId = -1;  //flush change flag
      state.discardFlag = 0;    //flush change flag
    },    
    deleteNote: (state, payload) => {     //on delete NOTE click
      for(let x=0, y=store.getters.getNotes.length; x<y; x++){
        state.notes[x].confirmDelete = false;   //save check unconfirmed flag
      }
      state.deleteId = payload;   //save current NOTE id
      store.getters.getDelNote.confirmDelete = true;    //switch on confirm delete flag
    },
    cdeleteNote: (state, payload) => {
      let dNtIdx = store.getters.findNoteIndex(state.deleteId);
      state.deleteId = -1;
      state.notes[dNtIdx].confirmDelete = false;
      state.notes.splice(dNtIdx, 1);      //remove current note from array
    },
    deleteNoteInEdit: (state, payload) => {   //delete action in EDITING MODE
      state.deleteId = state.editId;    //set current delete id as edit id 
      state.editState = false;    //switch off EDITING MODE
      state.editId = -1;    //flush edit id
      state.discardFlag = 0;  //flush change flag
      store.dispatch('cdeleteNote', payload);   //perform remove from array
    },    
    deleteTodo: (state, payload) => {      
      let note = store.getters.getEditNote;      //rel to current editing note
      let res = note.tasks.findIndex(x => x.id == payload.id);    //find todo by id in array
      state.notes[state.editId].tasks.splice(res, 1);   //remove from array
    },
    cancelDelete: (state, payload) => {     
      state.discardFlag = 0;    //flush change flag   
      store.getters.getDelNote.confirmDelete = false;    //flush delete flag
    },
    setDiscardFlag: (state, payload) => {
      state.discardFlag = payload;      //set change flag from payload
    }
  },
  actions: {      //actions can called in async way, unlike mutation (which are sync)
    initStore: async (context, payload) => {
      context.commit('initStore', payload);
    },
    onChange: async (context, payload) => {
      context.commit('onChange', payload);
    },
    addNote: async (context, payload) => {
      context.commit('addNote', payload);   
    },
    addTodo: async (context, payload) => {
      context.commit('addTodo', payload);   
    },    
    editNote: async (context, payload) => {
      context.commit('editNote', payload);
    },
    saveCommit: async (context, payload) => {      
      context.commit('saveCommit', payload);
    },    
    deleteNote: async (context, payload) => {      
      context.commit('deleteNote', payload);
    },
    cdeleteNote: async (context, payload) => {      
      context.commit('cdeleteNote', payload);
    },
    deleteNoteInEdit: async (context, payload) => {      
      context.commit('deleteNoteInEdit', payload);
    },
    deleteTodo: async (context, payload) => {
      context.commit('deleteTodo', payload);
    },
    cancelDelete: async (context, payload) => {
      context.commit('cancelDelete', payload);
    },
    backAction: async (context, payload) => {      
      context.commit('backAction', payload);
    },
    cancelExitAction: async (context, payload) => {
      context.commit('setDiscardFlag', 1);
    },
    discardAction: async (context, payload) => {
      context.commit('discardAction', payload);    
    }
  },
  plugins: [actionPlug]  
});

let noteList = {    //note list (main page) component
	template: '#notes-list',	
	methods: {
	    addNote() {
        this.$store.dispatch('addNote', this.$store.getters.newNote);    //create new NOTE  
	    },	    
	    editNote(item) {                
        this.$store.dispatch('editNote', item.id);       //go to EDIT MODE
	    },
      cancelDeleteNote(){
        this.$store.dispatch('cancelDelete');          //cancel delete action
      },
      deleteNote(item, key){        //delete note (with confirm)
        if(key == 1) this.$store.dispatch('deleteNote', item.id);
        else this.$store.dispatch('cdeleteNote', item.id);
      } 
  	}
};
let taskList = {    //task list (second page) - EDIT MODE
	template: '#task-list',	
	methods: {
    addTodo(){      //create new task
      this.$store.dispatch('addTodo', this.$store.state.newTask);
    },
    backAction(){      //return to main page (button click event)
      this.$store.dispatch('backAction', this.$store.getters.getEditId);
    },
		saveAction(){   //save changes in store
      this.$store.dispatch('saveCommit');        
		},
		onChange(){      //change event
      this.$store.dispatch("onChange");
	  },
    discardAction(){      //discard changes in EDIT MODE
      this.$store.dispatch('discardAction');
    },
    cancelExitAction(){   //discard EXIT from EDIT MODE
      this.$store.dispatch('cancelExitAction');
    },
    deleteTodo(item){   //remove task from array
      this.$store.dispatch('deleteTodo', item);
    },
    deleteNote(){       //delete current NOTE
      if(this.$store.getters.getEditNote.confirmDelete)
        this.$store.dispatch('deleteNoteInEdit');
      else
        this.$store.getters.getEditNote.confirmDelete = true;      
    },
    cancelDeleteNote(){   //cancel delete action
        this.$store.getters.getEditNote.confirmDelete = false;                
    }
	}
};

var app = new Vue({
  el: '#app',  
  store,  
  mounted() {   
    this._keyListener = function(e) {   //for shortcut
      if (e.ctrlKey || e.metaKey){    //comb: CTRL + key
        e.preventDefault();
        switch(e.key){          
          case "s":     // CTRL + S       save changes
            if(this.$store.getters.getDiscardFlag == 2){
              this.$store.dispatch('cancelExitAction');
            } 
            this.$store.dispatch('saveCommit');
          break;
          case "y":     // CTRL + Y           redo action 
            undoRedoHistory.redo();
          break;
          case "q":     // CTRL + Q         exit action             
            if(this.$store.getters.getDiscardFlag == 2) this.$store.dispatch('discardAction');
            else this.$store.dispatch('backAction');
          break;
          case "z":      // CTRL + Z          undo action 
            undoRedoHistory.undo();                   
          break;
          case "+":     // CTRL + +       create NEW NOTE / TODO
            if(!this.$store.getters.getEditState) this.$store.dispatch('addNote', this.$store.getters.newNote);
            else this.$store.dispatch('addTodo', this.$store.state.newTask); 
          break;
          default:
          break;
        }
      }     
    };   
    var beforeClose = function () {     //check for unsaved changes in EDIT MODE
      if(store.getters.getEditState && store.getters.getChanges)       
        return 'Unsaved Change';      
    };
    document.addEventListener('keydown', this._keyListener.bind(this));
    window.onbeforeunload = beforeClose;    //prevent window closing
  },  
  methods: {    
  	undo() {
      this.undo();      
    },
    redo() {
      this.redo();      
    }   
  },  
  components:{
  	noteList,
  	taskList
  }  
});

Vue.use(VuexUndoRedo);

