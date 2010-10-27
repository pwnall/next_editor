/** Editor UI for modern browsers that support contentEditable=true fields.
 *
 * This works on pretty much everything we target. Except for Victor's iPad.
 *
 * The options object should have the following properties:
 *   inputElement:: textarea for capturing events
 *   formSubmitter:: used to submit a form when the user presses Enter
 *   tokenizer:: conforms to the NextEditor.Tokenizer interface for deciding
 *               which parts of the text get highlighted
 */
NextEditor.UI.Fire = function(options) {
  this.inputElement = options.inputElement;
  if (!this.inputElement) {
    window.console && console.error("No input elment given! noop");
    return;
  }
  this.tokenizer = options.tokenizer; 
  if (!this.tokenizer) {
    window.console && console.error("No tokenizer given! noop");
    return;
  }
  
  this.formSubmitter = options.formSubmitter;
  this.buildEditor();
};

/** The textarea or input backing the element's contents. */
NextEditor.UI.Fire.prototype.inputElement = null;

/** The form to be submitted when the user presses Enter. */
NextEditor.UI.Fire.prototype.formElement = null;

/** The DOM element with contentEditable=true. */
NextEditor.UI.Fire.prototype.editorElement = null;

/** Constructs the editor DOM UI. */
NextEditor.UI.Fire.prototype.buildEditor = function() {
  var inputClass = this.inputElement.className;
  this.inputElement.className = '';
  this.inputElement.style.visibility = 'hidden';
  this.inputElement.style.position = 'absolute';
  this.inputElement.style.width = 0;
  this.inputElement.style.height = 0;
  
  this.editorElement = document.createElement('div');
  this.editorElement.className = inputClass;
  this.editorElement.contentEditable = "true";
  $(this.inputElement).before(this.editorElement);
  
  var text = $(this.inputElement).attr('value');
  var cursor = (document.activeElement == this.editorElement) ?
               text.length : null;
  
  var domData = NextEditor.DOM.buildDom(text, text.length);
  this.setEditorContent(domData);
};

/** The contents of the editor element last time we did highlighting. */
NextEditor.UI.Fire.prototype.oldContent = null;

/** Parses the editor content to make it nice, only if it changed. */
NextEditor.UI.Fire.prototype.onPossibleChange = function() {
  var htmlContent = this.editorElement.innerHTML;
  if (this.oldContent == htmlContent) return;
    
  var selection = window.getSelection();
  var content = NextEditor.DOM.elementContent(this.editorElement, selection);
  var tokens = this.tokenizer.tokenize(content.text);
  var domData = NextEditor.DOM.buildDom(tokens, content.cursor);  

  if (domData.cursorOffset != null) {
    this.setEditorContent(domData);    
    this.oldContent = this.editorElement.innerHTML;
    $(this.inputElement).attr('value', content.text);
  }
};

/** Updates the editor UI to reflect content change
 *
 * Args:
 *   domData:: the new DOM contents and selection information for the editor UI
 */
NextEditor.UI.Fire.prototype.setEditorContent = function(domData) {
  this.editorElement.innerHTML = '';
  for (var i = 0; i < domData.nodes.length; i++) {
    this.editorElement.appendChild(domData.nodes[i]);
  }
  
  if (domData.cursorOffset != null) {
    var range = document.createRange();
    var node = domData.cursorNode || this.editorElement;
    range.setStart(node, domData.cursorOffset);
    range.setEnd(node, domData.cursorOffset);
    
    var selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);  
  }
};

/** Submits the editor's form if the user presses Enter. */
NextEditor.UI.Fire.prototype.onSubmitKey = function() {
  this.formSubmitter.submit();
};

/** The DOM element receiving user input events. */
NextEditor.UI.Fire.prototype.eventSource = function() {
  return this.editorElement;
}

/** True if no change events should be generated when an IME UI is active. */
NextEditor.UI.Fire.prototype.needsImeSupport = function() {
  return true;
}
