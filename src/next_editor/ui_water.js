/** Editor UI for browsers that don't support contentEditable (iOS 3).
 *
 * The options object should have the following properties:
 *   inputElement:: textarea for capturing events
 *   formSubmitter:: used to submit a form when the user presses Enter
 *   tokenizer:: conforms to the NextEditor.Tokenizer interface for deciding
 *               which parts of the text get highlighted
 */
NextEditor.UI.Water = function(options) {
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
NextEditor.UI.Water.prototype.inputElement = null;

/** The form to be submitted when the user presses Enter. */
NextEditor.UI.Water.prototype.formElement = null;

/** The DOM element with contentEditable=true. */
NextEditor.UI.Water.prototype.editorElement = null;

/** Constructs the editor DOM UI. */
NextEditor.UI.Water.prototype.buildEditor = function() {
  this.editorElement = document.createElement('div');
  
  var matching_styles = ['padding', 'margin', 'border-left-width',
                         'border-right-width', 'border-top-width',
                         'border-bottom-width',
                         'height', 'width', 'font-family', 'font-size'];
  var style_hash = new Array();
  for (var i = 0; i < matching_styles.length; i++) {
    style_hash[matching_styles[i]] =
        $(this.inputElement).css(matching_styles[i]);
  }
  $(this.editorElement).css(style_hash);
  $(this.editorElement).css({'z-index' : -5});

  $(this.inputElement).css({'background-color': 'transparent', 'opacity': 0.0,
      'visibility': 'visible', 'position': 'absolute', 'left': '4px',
      'top': '3px'});
  $(this.inputElement).after(this.editorElement);
  
  this.onPossibleChange();
};

/** The contents of the editor element last time we did highlighting. */
NextEditor.UI.Water.prototype.oldContent = null;

/** Parses the editor content to make it nice, only if it changed. */
NextEditor.UI.Water.prototype.onPossibleChange = function() {
  var text = $(this.inputElement).attr('value');
  if (this.oldContent == text) return;
    
  var tokens = this.tokenizer.tokenize(text);
  var domData = NextEditor.DOM.buildDom(tokens, null);  

  this.setEditorContent(domData);    
  this.oldContent = text;
};

/** Updates the editor UI to reflect content change
 *
 * Args:
 *   domData:: the new DOM contents and selection information for the editor UI
 */
NextEditor.UI.Water.prototype.setEditorContent = function(domData) {  
  this.editorElement.innerHTML = '';
  for (var i = 0; i < domData.nodes.length; i++) {
    this.editorElement.appendChild(domData.nodes[i]);
  }
};

/** Submits the editor's form if the user presses Enter. */
NextEditor.UI.Water.prototype.onSubmitKey = function() {
  this.formSubmitter.submit();
};

/** The DOM element receiving user input events. */
NextEditor.UI.Water.prototype.eventSource = function() {
  return this.inputElement;
}

/** True if no change events should be generated when an IME UI is active. */
NextEditor.UI.Water.prototype.needsImeSupport = function() {
  return true;
}
