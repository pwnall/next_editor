/** Namespace for the text parsing functionality. */
NextEditor.Parsing = {
  /** Computes the class that a word's span should get, for highlighting.
   * 
   * Args:
   *   text:: the word to be highlighted (or not)
   * 
   * Returns a String containing the class that should be applied to the span.
   * CSS takes it from there.
   */
  wordSpanClass: function(word) {
    if (document.wordDictionary && document.wordDictionary[word]) {
      return document.wordDictionary[word];
    }
    return '';
  }
}

  
/** The class to be used for the editor's UI. */
NextEditor.editorClass = function(forceWater) {
  if (forceWater || !NextEditor.Support.hasContentEditable()) {
    return NextEditor.Water;
  }
  return NextEditor.Fire;
};

/** Editor UI for modern browsers that support contentEditable=true fields.
 *
 * This works on pretty much everything we target. Except for Victor's iPad.
 *
 * Constructor args:
 *   editorElement:: div element that displays the formatted text.
 *   inputElement:: textarea for capturing events.
 *   formElement:: for submitting the text message.
 */
NextEditor.Fire = function(editorElement, inputElement, formElement) {
  var e = this;

  /** The DOM element with contentEditable=true. */
  e.editorElement = editorElement;
  /** The textarea or input backing the element's contents. */
  e.inputElement = inputElement;
  /** The form to be submitted when the user presses Enter. */
  e.formElement = formElement;
  
  /** The contents of the element last time we did highlighting. */
  e.oldContent = null;

  /** Parses the editor content to make it nice, only if it changed. */
  e.contentMayHaveChanged = function() {
    var htmlContent = e.editorElement.innerHTML;
    if (e.oldContent == htmlContent) return;
    
    var selection = window.getSelection();
    var contentData = NextEditor.Parsing.parseElement(e.editorElement,
                                                      selection);
    
    var formattedData = NextEditor.Parsing.formatText(contentData.text,
                                                      contentData.cursor);
    if (formattedData.cursorOffset != null) {
      e.editorElement.innerHTML = '';
      for (var i = 0; i < formattedData.nodes.length; i++) {
        e.editorElement.appendChild(formattedData.nodes[i]);
      }
      
      var range = document.createRange();
      range.setStart(formattedData.cursorNode || e.editorElement,
                     formattedData.cursorOffset);
      range.setEnd(formattedData.cursorNode || e.editorElement,
                   formattedData.cursorOffset);
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      e.oldContent = e.editorElement.innerHTML;
    }
    
    $(e.inputElement).attr('value', contentData.text);
  }
  e.contentMayHaveChanged();
  
  /** Set to true when an Enter press is intercepted.
   *
   * Without this, we tend to submit the same message multiple times.
   */
  e.submitted = false;
  
  /** Submits the message composing form via XHR.
   *
   * The method also makes sure that the form is only submitted once.
   */
  e.submitForm = function() {
    if (!e.submitted) {
      e.submitted = true;
      var el      = $(e.formElement),
          method  = el.attr('method') || el.attr('data-method') || 'GET',
          url     = el.attr('action') || el.attr('href'),
          dataType  = el.attr('data-type')  || 'script';

      var data = el.is('form') ? el.serializeArray() : [];
      $.ajax({
          url: url,
          data: data,
          dataType: dataType,
          type: method.toUpperCase(),
      });
    }
  }

}

/** Editor UI for browsers that don't support contentEditable (iPad OS 3.2).
 *
 * Constructor args:
 *   editorElement:: div element that displays the formatted text.
 *   inputElement:: textarea for capturing events.
 *   formElement:: for submitting the text message.
 */
NextEditor.Water = function(editorElement, inputElement, formElement) {
  var e = this;

  /** The DOM element with contentEditable=true. */
  e.editorElement = editorElement;
  /** The textarea or input backing the element's contents. */
  e.inputElement = inputElement;
  /** The form to be submitted when the user presses Enter. */
  e.formElement = formElement;
  
  /** The contents of the element last time we did highlighting. */
  e.oldContent = null;
  
  e.applyEditorStyle = function() {
    var matching_styles = ['padding', 'margin', 'border-left-width',
                           'border-right-width', 'border-top-width',
                           'border-bottom-width',
                           'height', 'width', 'font-family', 'font-size'];
    var style_hash = new Array();
    var inputElement = $(e.inputElement);
    var editorElement = $(e.editorElement);
    for (var i = 0; i < matching_styles.length; i++) {
      style_hash[matching_styles[i]] = editorElement.css(matching_styles[i]);
    }
    inputElement.css(style_hash);        
    editorElement.css({'z-index' : -5});
    editorElement.attr('contentEditable', 'false');
    $(editorElement).before(
        '<style type="text/css">.no, .may, .yes { padding: 0 !important; }</style>');
    
    inputElement.css({'background-color' : 'transparent',
                      'opacity' : 0.0,
                      'visibility' : 'visible',
                      'position' : 'absolute',
                      'left' : '4px',
                      'top' : '3px'});
  }
  e.applyEditorStyle();

  /** Parses the editor content to make it nice, only if it changed. */
  e.contentMayHaveChanged = function() {
    var text = $(e.inputElement).val();
    if (e.oldContent == text) return;
    
    var formattedData = NextEditor.Parsing.formatText(text, null);
    $(e.editorElement).html('');
    for (var i = 0; i < formattedData.nodes.length; i++) {
      e.editorElement.appendChild(formattedData.nodes[i]);
    }
      
    e.oldContent = text;
  }
  e.contentMayHaveChanged();
  
  /** Set to true when an Enter press is intercepted.
    *
    * Without this, we tend to submit the same message multiple times.
    */
  e.submitted = false;

  /** Called on DOM events indicating the editor's contents may have changed. */
  e.onChange = function(event) {
    e.contentMayHaveChanged();
  }
  $(e.inputElement).bind('keypress', e.onChange);
  $(e.inputElement).bind('input', e.onChange);
}

