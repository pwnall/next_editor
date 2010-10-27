/** NextLang message composer UI.
 * Copyright 2010 Victor Costan and Ying Yin. MIT License.
 */

/** Namespace for the NextLang syntax-highlighting editor. */
NextEditor = {};
 
/** Constructs a syntax-highlighting editor.
 *
 * The options object should have the following properties:
 *   inputElement:: textarea serving as a placeholder for the editor; the
 *                  textarea will receive the editor's input
 *   formElement:: submitted when the user presses Enter (optional)
 *   forceWater:: uses the Water UI, even in newer browsers; intended for
 *                debugging the rigid CSS, or the Water itself
 *   tokenizer:: decies who 
 */
NextEditor.create = function(options) {
  var formElement = options.formElement;
  if (formElement) {
    var formSubmitter = new NextEditor.Submitter(formElement);   
  }
  else {
    var formSubmitter = null;
  }
  
  var klass = NextEditor.UI.editorClass(options.forceWater);
  var editorUI = new klass({
    inputElement: options.inputElement,
    formSubmitter: formSubmitter,
    tokenizer: tokenizer
  });
  
  var tokenizer = options.tokenizer;
  if (!tokenizer) {
    tokenizer = new NextEditor.Tokenizers.WordTokenizer({});
  }
  
  var inputController = new NextEditor.Input({
    eventSource: options.inputElement,
    observer: editorUI,
    multiLine: (formSubmitter ? false : true)
  });

  return { ui: editorUI, input: inputController, tokenizer: tokenizer };
};
