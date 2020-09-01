const MDCSelect = [].map.call(document.querySelectorAll('.mdc-select'), function(el) {
    return new mdc.select.MDCSelect(el);
  });
//const formFields = new mdc.formField.MDCFormField(document.querySelector('.mdc-form-field'));
//const textFields = new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field'));
const formFields = [].map.call(document.querySelectorAll('.mdc-form-field'), function(el) {
    return new mdc.formField.MDCFormField(el);
  });
const textFields = [].map.call(document.querySelectorAll('.mdc-text-field'), function(el) {
    return new mdc.textField.MDCTextField(el);
  });
 
const buttons = [].map.call(document.querySelectorAll('.mdc-button'), function(el) {
    return new mdc.ripple.MDCRipple(el);
});
//const select = new MDCSelect(document.querySelector(".mdc-select"));