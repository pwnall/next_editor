/** Editor UI for modern browsers that support contentEditable=true fields.
 *
 * This works on pretty much everything we target. Except for Victor's iPad.
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
NextEditor.UI.Fire = function (options) {
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
NextEditor.UI.Fire.prototype.inputElement = null;

/** The form to be submitted when the user presses Enter. */
NextEditor.UI.Fire.prototype.formElement = null;

/** The DOM element with contentEditable=true. */
NextEditor.UI.Fire.prototype.editorElement = null;

/** Constructs the editor DOM UI. */
NextEditor.UI.Fire.prototype.buildEditor = function () {
  var inputClass = this.inputElement.className;
  this.inputElement.className = '';
  this.inputElement.style.visibility = 'hidden';
  this.inputElement.style.position = 'absolute';
  this.inputElement.style.width = 0;
  this.inputElement.style.height = 0;
  this.inputElement.style.margin = 0;
  this.inputElement.style.padding = 0;
  this.inputElement.style.border = 'none';
  this.inputElement.style.left = 0;
  this.inputElement.style.top = 0;
  
  this.editorElement = document.createElement('div');
  this.editorElement.style.width = this.editorElement.style.height = '100%';
  this.editorElement.style.margin = '0';
  this.editorElement.style.padding = '0';
  this.editorElement.style.border = 'none';
  $(this.editorElement).attr('contentEditable', 'true');

  // Workaround Firefox bug that shows resizing and moving controls for
  // contentEditable=true elements if they have position: absolute.
  // https://bugzilla.mozilla.org/show_bug.cgi?id=531159  
  var wrapper = document.createElement('div');
  wrapper.className = inputClass;
  $(this.inputElement).before(wrapper);
  $(wrapper).append(this.editorElement);
  $(wrapper).append(this.inputElement);
  
  var text = $(this.inputElement).attr('value');
  var tokens = this.tokenizer.tokenize(text + "\n");
  var cursor = (document.activeElement === this.editorElement) ?
               text.length : null;
  
  var domData = NextEditor.DOM.buildDom(tokens, text.length);
  this.setEditorContent(domData);
};

/** The contents of the editor element last time we did highlighting. */
NextEditor.UI.Fire.prototype.oldContent = null;

/** Parses the editor content to make it nice, only if it changed. */
NextEditor.UI.Fire.prototype.onPossibleChange = function () {
  var htmlContent = this.editorElement.innerHTML;
  if (this.oldContent === htmlContent) {
    return;
  }
    
  var selection = window.getSelection();
  var content = NextEditor.DOM.elementContent(this.editorElement, selection);
  
  // Always have a newline at the end, to appease Firefox. Never allow the
  // cursor to be set there.
  if (content.text[content.text.length - 1] !== "\n") {
    content.text += "\n";
  }
  if (content.cursor === content.length) {
    content.cursor = content.length - 1;
  }
  
  var tokens = this.tokenizer.tokenize(content.text);
  var domData = NextEditor.DOM.buildDom(tokens, content.cursor);  

  if (domData.cursorOffset !== null) {
    this.setEditorContent(domData);    
    this.oldContent = this.editorElement.innerHTML;
    // Strip the newline off the value.
    $(this.inputElement).val(content.text.substr(0, content.text.length - 1));
  }
  
  if (this.onChangeCallback) {
    this.onChangeCallback(this.inputElement);
  }
};

/** Updates the editor UI to reflect content change
 *
 * Args:
 *   domData:: the new DOM contents and selection information for the editor UI
 */
NextEditor.UI.Fire.prototype.setEditorContent = function (domData) {  
  this.editorElement.innerHTML = '';
  for (var i = 0; i < domData.nodes.length; i += 1) {
    this.editorElement.appendChild(domData.nodes[i]);
  }
  
  if (domData.cursorOffset !== null) {
    var range = document.createRange();
    var node = domData.cursorNode || this.editorElement;
    range.setStart(node, domData.cursorOffset);
    range.setEnd(node, domData.cursorOffset);
    
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);  
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
NextEditor.UI.Fire.prototype.eventSource = function () {
  return this.editorElement;
};

/** True if no change events should be generated when an IME UI is active. */
NextEditor.UI.Fire.prototype.needsImeSupport = function () {
  return true;
};
