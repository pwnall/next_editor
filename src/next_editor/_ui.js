/** Namespace for the view code. */
NextEditor.UI = {};

/** The class to be used for the editor's UI. */
NextEditor.UI.editorClass = function (forceWater) {
  if (forceWater || !NextEditor.Support.hasContentEditable()) {
    return NextEditor.UI.Water;
  }
  return NextEditor.UI.Fire;
};
