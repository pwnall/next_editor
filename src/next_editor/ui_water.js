/** Editor UI for browsers that don't support contentEditable (iOS 3).
 *
 * The options object should have the following properties:
 *   inputElement:: textarea for capturing events
 *   onSubmitKey:: function (element) that is invoked when the user expresses
 *                 their desire to submit a Enter in the input field; returning
 *                 false will cancel the event, which is useful if you want to
 *                 submit a form via AJAX
 *   tokenizer:: conforms to the NextEditor.Tokenizer interface for deciding
 *               which parts of the text get highlighted
 */
NextEditor.UI.Water = function (options) {
  this.inputElement = options.inputElement;
  if (!this.inputElement) {
    if (window.console) {
      window.console.error("No input elment given! noop");
    }
    return;
  }
  this.tokenizer = options.tokenizer; 
  if (!this.tokenizer) {
    if (window.console) {
      window.console.error("No tokenizer given! noop");
    }
    return;
  }
  
  this.onChangeCallback = options.onChange;
  this.onSubmitCallback = options.onSubmitKey;
  this.buildEditor();
};

/** The textarea or input backing the element's contents. */
NextEditor.UI.Water.prototype.inputElement = null;

/** The form to be submitted when the user presses Enter. */
NextEditor.UI.Water.prototype.formElement = null;

/** The DOM element with contentEditable=true. */
NextEditor.UI.Water.prototype.editorElement = null;

/** Constructs the editor DOM UI. */
NextEditor.UI.Water.prototype.buildEditor = function () {
  var inputClass = this.inputElement.className;  
  var wrapper = document.createElement('div');
  wrapper.className = inputClass + ' rigid_editor';
  $(this.inputElement).before(wrapper);
  
  this.editorElement = document.createElement('div');
  this.editorElement.style.position = 'absolute';
  this.editorElement.style.width = this.editorElement.style.height = '100%';
  this.editorElement.style.margin = 0;
  this.editorElement.style.padding = 0;
  this.editorElement.style.border = 'none';
  this.editorElement.style.zIndex = -5;
  this.editorElement.style.backgroundColor = 'transparent';
  this.editorElement.style.resize = 'none';
  this.editorElement.style.overflow = 'hidden';

  this.inputElement.className = '';
  this.inputElement.style.position = 'absolute';
  this.inputElement.style.width = this.inputElement.style.height = '100%';
  this.inputElement.style.margin = 0;
  this.inputElement.style.padding = 0;
  this.inputElement.style.border = 'none';
  this.inputElement.style.zIndex = 0;
  this.inputElement.style.backgroundColor = 'transparent';
  this.inputElement.style.font = 'inherit';
  this.inputElement.style.resize = 'none';
  this.inputElement.style.overflow = 'hidden';
  this.inputElement.style.color = 'rgba(0,0,0,0)';
  if (this.inputElement.style.webkitAppearance !== undefined) {
    this.inputElement.style.webkitAppearance = 'none';
  }
  if (this.inputElement.style.MozAppearance !== undefined) {
    this.inputElement.style.MozAppearance = 'none';
  }

  $(wrapper).append(this.editorElement);  
  $(wrapper).append(this.inputElement);
  
  this.onPossibleChange();
};

/** The contents of the editor element last time we did highlighting. */
NextEditor.UI.Water.prototype.oldContent = null;

/** Parses the editor content to make it nice, only if it changed. */
NextEditor.UI.Water.prototype.onPossibleChange = function () {
  var text = $(this.inputElement).val();
  if (this.oldContent === text) {
    return;
  }
    
  var tokens = this.tokenizer.tokenize(text);
  var domData = NextEditor.DOM.buildDom(tokens, null);  

  this.setEditorContent(domData);    
  this.oldContent = text;

  if (this.onChangeCallback) {
    this.onChangeCallback(this.inputElement);
  }
};

/** Updates the editor UI to reflect content change
 *
 * Args:
 *   domData:: the new DOM contents and selection information for the editor UI
 */
NextEditor.UI.Water.prototype.setEditorContent = function (domData) {  
  this.editorElement.innerHTML = '';
  for (var i = 0; i < domData.nodes.length; i += 1) {
    this.editorElement.appendChild(domData.nodes[i]);
  }
};

/** Submits the editor's form if the user presses Enter. */
NextEditor.UI.Fire.prototype.onSubmitKey = function () {
  if (this.onSubmitCallback) {
    return this.onSubmitCallback(this.inputElement);
  } else {
    return true;
  }
};

/** The DOM element receiving user input events. */
NextEditor.UI.Water.prototype.eventSource = function () {
  return this.inputElement;
};

/** True if no change events should be generated when an IME UI is active. */
NextEditor.UI.Water.prototype.needsImeSupport = function () {
  return false;
};
