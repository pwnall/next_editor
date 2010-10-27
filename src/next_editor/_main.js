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
 */
NextEditor.create = function(options) {
  var klass = this.editorClass(options.forceWater);

  var editorUI = new klass(options);
  var inputHandling = new NextEditor.Input({
    eventSource: options.inputElement,
    observer: editorUI,
    multiLine: options.multiLine
  });

  return new klass(options);
};
