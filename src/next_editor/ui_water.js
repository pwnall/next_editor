/** Editor UI for browsers that don't support contentEditable (iOS 3).
 *
 * The options object should have the following properties:
 *   inputElement:: textarea for capturing events
 *   formSubmitter:: used to submit a form when the user presses Enter
 *   tokenizer:: conforms to the NextEditor.Tokenizer interface for deciding
 *               which parts of the text get highlighted
 */
NextEditor.UI.Water = function(editorElement, inputElement, formElement) {
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
}

