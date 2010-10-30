/** Facilitates the submission of a form element. */
NextEditor.Submitter = function (formElement) {
  this.formElement = formElement;
  if (!this.formElement) {
    if (window.console) {
      window.console.error("No form element given! noop");
    }
    return;
  }
};

/** The form to be submitted. */
NextEditor.Submitter.prototype.formElement = null;

/** Set to true when an Enter press is intercepted.
 *
 * Without this, we tend to submit the same message multiple times.
 */
NextEditor.Submitter.prototype.submitted = false;

/** Submits the message composing form via XHR.
 *
 * The method also makes sure that the form is only submitted once.
 */
NextEditor.Submitter.prototype.submit = function () {
  if (this.submitted) {
    return;
  }  
  this.submitted = true;
  
  // HACK: copy-pasted from rails.js because bubbling a submit event failed
  var el      = $(this.formElement),
      method  = el.attr('method') || el.attr('data-method') || 'GET',
      url     = el.attr('action') || el.attr('href'),
      dataType  = el.attr('data-type')  || 'script';

  var data = el.is('form') ? el.serializeArray() : [];
  $.ajax({
    url: url,
    data: data,
    dataType: dataType,
    type: method.toUpperCase()
  });
};
