/** NextLang message composer UI.
 * Copyright 2010 Victor Costan and Ying Yin. MIT License.
 */

/*jslint white: true, maxlen: 80, indent: 2, onevar: false */
/*global document, window, navigator, setTimeout, $ */

/** Namespace for the NextLang syntax-highlighting editor. */
var NextEditor = {};
 
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
NextEditor.create = function (options) {
  var formElement = options.formElement;
  var formSubmitter = (formElement) ? (new NextEditor.Submitter(formElement)) :
                                      null;
    
  var tokenizer = options.tokenizer;
  if (!tokenizer) {
    tokenizer = new NextEditor.Tokenizers.WordTokenizer({});
  }
  
  var UIClass = NextEditor.UI.editorClass(options.forceWater);
  var editorUI = new UIClass({
    inputElement: options.inputElement,
    formSubmitter: formSubmitter,
    tokenizer: tokenizer
  });
  
  var inputController = new NextEditor.Input({
    eventSource: editorUI.eventSource(),
    imeSupport: editorUI.needsImeSupport(),
    observer: editorUI,
    multiLine: (formSubmitter ? false : true)
  });

  return { ui: editorUI, input: inputController, tokenizer: tokenizer };
};
